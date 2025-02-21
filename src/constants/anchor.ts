import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { AnchorProvider, Program} from "@coral-xyz/anchor"
import { PROGRAM_ID } from './index'
import { Pixel, IDL } from './pixel_type'
export function getAnchorProgram(
  connection: Connection,
  wallet: AnchorWallet
) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed"})
  const program = new Program<Pixel>(IDL, PROGRAM_ID , provider)
  return program
}