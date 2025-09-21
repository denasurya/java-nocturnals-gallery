import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from './contractInfo';
import './App.css';

// Menambahkan definisi window.ethereum secara global
declare global {
    interface Window {
        ethereum?: any;
    }
}

interface NFT {
  id: number;
  name: string;
  description: string;
  image: string;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const fetchInitiated = useRef(false);

  useEffect(() => {
    const fetchCollection = async () => {
      if (fetchInitiated.current) return;
      fetchInitiated.current = true;

      setLoading(true);
      try {
        const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
        if (!rpcUrl) throw new Error("VITE_SEPOLIA_RPC_URL tidak ditemukan");

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        const tempNfts: NFT[] = [];
        for (let i = 0; i < 10; i++) {
          if (i === 5) continue; 

          const tokenURI = await contract.tokenURI(i);
          const metadataUrl = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
          const metadataResponse = await fetch(metadataUrl);
          const metadata = await metadataResponse.json();
          
          tempNfts.push({
            id: i,
            name: metadata.name || "Untitled",
            description: metadata.description || "No description",
            image: metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"),
          });
        }
        setNfts(tempNfts);
      } catch (error) {
        console.error("Gagal mengambil koleksi NFT:", error);
        alert("Gagal memuat koleksi. Pastikan RPC URL di file .env sudah benar dan coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, []);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (error) {
        console.error("Gagal menghubungkan dompet:", error);
      }
    } else {
      alert("Tolong pasang MetaMask!");
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Galeri NFT Java Nocturnals</h1>
        {account ? <p>Terhubung sebagai: {account}</p> : <button onClick={connectWallet}>Connect Wallet</button>}
      </header>
      <main>
        {loading && <p className="loading-text">Memuat koleksi NFT Anda...</p>}
        <div className="gallery">
          {nfts.map((nft) => (
            <div key={nft.id} className="nft-card">
              <img src={nft.image} alt={nft.name} loading="lazy" />
              <div className="nft-info">
                <h2>{nft.name}</h2>
                <p>{nft.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;