'use client';

import { client } from "@/app/client";
import { NFT } from "thirdweb";
import { MediaRenderer } from "thirdweb/react";

type NFTCollectionProps = {
    nfts: NFT[];
};

export const NFTCollection = ({ nfts }: NFTCollectionProps) => {
    const handleClick = (nft: NFT) => {
        const openseaUrl = `https://testnets.opensea.io/assets/sepolia/0x3059a544ff0268174bdf13eab471455175287652/${nft.metadata.id || nft.id}`;
        window.open(openseaUrl, '_blank');
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "20px",
        }}>
            <h3>AI Generations:</h3>
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                maxWidth: "600px",
            }}>
                {nfts.map((nft) => (
                    <div 
                        key={nft.metadata.id || nft.id} 
                        style={{
                            padding: "5px",
                            width: "150px",
                            height: "150px",
                            cursor: "pointer",
                        }}
                        onClick={() => handleClick(nft)}
                    >
                        <MediaRenderer
                            client={client}
                            src={nft.metadata.image}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "6px",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
