import { useState, memo, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { toast } from 'react-toastify'
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { getAnchorProgram } from '../constants/anchor'
import { getJitoTransferJito, sendTransactionWithJito } from '../utils/jito'
import { IS_MAIN, BACKEND_URI } from '../constants'
import DrawPixel from '../components/DrawPixel'

const Create = () => {
  const [isShowCreatePixel, setIsShowCreatePixel] = useState<boolean>(true)
  const [pixelImageURI, setPixelImageURI] = useState<string>('')
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  // const navigate = useNavigate()
  const [tokenName, setTokenName] = useState('')
  const [tokenTicker, setTokenTicker] = useState('')
  const [tokenDesc, setTokenDesc] = useState('')

  const [twitterUrl, setTwitterUrl] = useState('')
  const [telegramUrl, setTelegramUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const dataURItoBlob = (dataURI: string) => {
    const binary = atob(dataURI.split(',')[1])
    const array = []
    for (let i=0; i< binary.length; i++){
      array.push(binary.charCodeAt(i))
    }
    return new Blob([new Uint8Array(array)], { type: 'image/png'})
  }
  const createToken = async () => {
    //get tokenUri
    let tokenUri = ""
    try {
      const data = new FormData()
      const blob = dataURItoBlob(pixelImageURI)
      const file = new File([blob], 'pixel.png', { type: "image/png", lastModified: new Date().getTime()})
      data.append('file', file)
      data.append('tokenName', tokenName)
      data.append('tokenSymbol', tokenTicker)
      data.append('tokenDesc', tokenDesc)
      data.append('tokenTelegram', telegramUrl)
      data.append('tokenTwitter', twitterUrl)
      data.append('tokenWebsite', websiteUrl)
      const res = await fetch(
        `${BACKEND_URI}/tokens/ipfs`,
        {
          method: 'POST',
          body: data,
        }
      )
      const resInfo = await res.json();
        if (!resInfo.ok) {
          toast.error('Failed to upload image to IPFS');
          return
        }
        tokenUri = resInfo.uri;
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      toast.error('Failed to upload image to IPFS')
      return
    }

    if (!wallet) {
      toast.error("Please connect wallet first.")
      return
    }
    if (!tokenName || !tokenTicker || !tokenDesc) {
      toast.error("Please input the correct information!")
      return
    }
    try {
      const program = getAnchorProgram(connection, wallet)
      const [ config ] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )
      const tokenMint = Keypair.generate()
      const [ bonding_curve ]= PublicKey.findProgramAddressSync(
        [Buffer.from('bonding_curve'), tokenMint.publicKey.toBuffer()],
        program.programId
      )
      const assiciated_bonding_curve = getAssociatedTokenAddressSync(tokenMint.publicKey, bonding_curve, true)
      const metaplexProgramId = new PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      )
      const [metadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          metaplexProgramId.toBuffer(), // mpl_token_metadata program id
          tokenMint.publicKey.toBuffer(),
        ],
        metaplexProgramId,
      )

      const createTokenIns = await program.methods.createToken({
        name: Buffer.from(tokenName),
        symbol: Buffer.from(tokenTicker),
        uri: Buffer.from(tokenUri),
      }).accounts({
          payer: wallet.publicKey,
          tokenMint: tokenMint.publicKey,
          bondingCurve: bonding_curve,
          associtedBondingCurve: assiciated_bonding_curve,
          config,
          metadata,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: metaplexProgramId,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
      }).instruction()
      let isSuccess = false
      if (IS_MAIN) { // use jito in mainnet
        let latestBlockhash
        try{
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        }catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const jitoTransferIns = getJitoTransferJito(wallet.publicKey)
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [
            jitoTransferIns,
            createTokenIns,
          ]
        }).compileToV0Message()
        const versionTx = new VersionedTransaction(messageV0)
        versionTx.sign([tokenMint])
        const signedVersionTransaction = await wallet.signTransaction(versionTx)
        isSuccess = await sendTransactionWithJito(program.provider.connection, signedVersionTransaction)
      } else { // use devnet
        let latestBlockhash
        try{
          latestBlockhash = await program.provider.connection.getLatestBlockhash('confirmed')
        }catch(e) {
          toast.success(`Failed to get Latest blockhash from chain.`)
          return
        }
        const tx = new Transaction()
        tx.add(createTokenIns)
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = wallet.publicKey
        tx.sign(tokenMint)
        const signedTx = await wallet.signTransaction(tx)
        try {
          await sendAndConfirmRawTransaction(program.provider.connection, signedTx.serialize(), { commitment: 'confirmed'})
          // await sendAndConfirmTransaction(program.provider.connection, signedTx, [], {commitment :'confirmed'})
          isSuccess = true
        } catch (e) {
          console.log(e)
          isSuccess = false
        }
      }

      if (isSuccess){
        toast.success(`Created ${tokenName} token successfully.`)
      } else {
        toast.error(`Failed to create token!`)
      }
    } catch (e) {
      console.log(e)
      toast.error(`Failed to create token!`)
    }
  }
  return(
    <>
    {
      isShowCreatePixel && <DrawPixel setPixelImageURI={ setPixelImageURI } setIsShowCreatePixel={setIsShowCreatePixel} />
    }
    {
      !isShowCreatePixel && (
    <div className="mt-[70px] flex flex-col justify-center items-center w-full lg:w-[700px] mx-auto mb-[100px]">
      <div className="w-[210px]">
        <div className="border-2 border-[#6e6e6e] p-2 bg-white">
          <img src={pixelImageURI} />
          <input className="hidden" type="file" id="imageUpload" accept="image/*" />
        </div>
      </div>
      <div className="w-full lg:w-[600px] px-2">
        <div className="flex flex-col mt-[30px]">
          <p className="text-left flex text-[#c2c2c2] text-[21px]">NAME</p>
          <input
            type="text"
            className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
            placeholder="PIXEL NAME"
            value={ tokenName }
            onChange={(e) => {setTokenName(e.target.value)}}
          />
        </div>
        <div className="flex flex-col mt-[20px]">
          <p className="text-left flex text-[#c2c2c2] text-[21px]">TICKER</p>
          <input
            type="text"
            className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
            placeholder="$TICKER"
            value={ tokenTicker }
            onChange={(e) => {setTokenTicker(e.target.value)}}
          />
        </div>
        <div className="flex flex-col mt-[20px]">
          <p className="text-left flex text-[#c2c2c2] text-[21px]">DESCRIPTION</p>
          <input
            type="text"
            className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
            placeholder="DESCRIBE YOUR PIXEL"
            value={ tokenDesc }
            onChange={(e) => {setTokenDesc(e.target.value)}}
          />
        </div>
        <div className="flex flex-col mt-[20px]">
          <p className="text-left flex text-[#c2c2c2] text-[21px]">SOCIALS</p>
          <div className="flex flex-col gap-y-[20px] mt-[20px]">
            <div className="flex gap-x-[15px]">
              <div className="border-2 border-[#6e6e6e] p-2 flex items-center justify-center bg-transparent">
                <img src="/imgs/x-logo.webp" width={28} height={28} alt="x-logo" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
                  placeholder="TWITTER URL"
                  value={ twitterUrl }
                  onChange={(e) => {setTwitterUrl(e.target.value)}}
                />
              </div>
            </div>
            <div className="flex gap-x-[15px]">
              <div className="border-2 border-[#6e6e6e] p-2 flex items-center justify-center bg-transparent">
                <img src="/imgs/telegram.png" width={28} height={28} alt="telegram-logo" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
                  placeholder="TELEGRAM URL"
                  value={ telegramUrl }
                  onChange={(e) => {setTelegramUrl(e.target.value)}}
                />
              </div>
            </div>
            <div className="flex gap-x-[15px]">
              <div className="border-2 border-[#6e6e6e] p-2 flex items-center justify-center bg-transparent">
                <img src="/imgs/globe-icon.png" width={28} height={28} alt="website-logo" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  className="border-2 border-[#6e6e6e] p-2 text-[white] text-[21px] w-full bg-transparent outline-none"
                  placeholder="WEBSITE URL"
                  value={ websiteUrl }
                  onChange={(e) => {setWebsiteUrl(e.target.value)}}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-[50px]">
          <button
            className="border-2 border-[#EDFF02] border-solid w-[200px] py-1 text-[#EDFF02] text-[10px] font-normal cursor-pointer min-w-[300px]"
            style={{fontFamily:'wf_56906c412d2a453f907c10dd5'}}
            onClick={() => {
              createToken()
            }}
          >
            LAUNCH PIXEL
          </button>
        </div>
      </div>
    </div>
    )}
    </>)
}

export default memo(Create)