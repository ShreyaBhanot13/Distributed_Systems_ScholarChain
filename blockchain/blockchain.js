import { ethers } from 'ethers';
import ResearchPortal from '../build/contracts/ResearchPortal.json' assert { type: "json" };

const contractAddress = "0x059fBA0A84E0F5Fe12fA401D626502C8602Cf46F"
; // from migration output

export async function submitPaper(title, ipfsHash) {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, ResearchPortal.abi, signer);

  const tx = await contract.submitPaper(title, ipfsHash);
  await tx.wait();

  return tx.hash;
}
