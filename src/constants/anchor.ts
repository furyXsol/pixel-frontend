import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { Provider, AnchorProvider, Program} from "@coral-xyz/anchor"
import { PROGRAM_ID } from './index'
import { Pixel, IDL } from './pixel_type'
export function getAnchorProgram(
  connection: Connection,
  wallet?: AnchorWallet
) {
  if (wallet) {
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed"})
    const program = new Program<Pixel>(IDL, PROGRAM_ID , provider)
    return program
  } else {
    const provider = {
      connection
    } as Provider
    const program = new Program<Pixel>(IDL, PROGRAM_ID , provider)
    return program
  }
  
}