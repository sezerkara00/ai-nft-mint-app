'use client';

import { chain } from "@/app/chain";
import { client } from "@/app/client";
import { useState } from "react";
import { ConnectButton, MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { NFTCollection } from "./NFTCollection";
import { getNFTs } from "thirdweb/extensions/erc721";
import { contract } from "../utils/contract";

export const AIGenerate = () => {
    const account = useActiveAccount();
    const [imagePrompt, setImagePrompt] = useState("");
    const [generatedImage, setGeneratedImage] = useState("");
    const [userImage, setUserImage] = useState<File | null>(null);
    const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
    const [imageName, setImageName] = useState("");
    const [imageDescription, setImageDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const [useAIImage, setUseAIImage] = useState(true);
    const [mintedImage, setMintedImage] = useState("");

    const { data: nfts, refetch: refetchNFTs } = useReadContract(
        getNFTs,
        {
            contract: contract,
        }
    );

    const handleGenerateAndMint = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsGenerating(true);
        let imageUri = "";

        try {
            if (useAIImage) {
                console.log("Generating image");
                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        imagePrompt
                    }),
                });

                if (!res.ok) {
                    throw new Error("Failed to generate image");
                }

                const data = await res.json();
                const imageBlob = await fetch(data.data[0].url).then((res) => res.blob());

                const file = new File([imageBlob], "image.png", { type: "image/png" });
                imageUri = await upload({
                    client: client,
                    files: [file],
                });

                if (!imageUri) {
                    throw new Error("Error uploading image to IPFS");
                }
            } else {
                if (!userImage) {
                    throw new Error("No image uploaded");
                }

                imageUri = await upload({
                    client: client,
                    files: [userImage],
                });

                if (!imageUri) {
                    throw new Error("Error uploading image to IPFS");
                }
            }

            setGeneratedImage(imageUri);
            setIsGenerating(false);
            setIsMinting(true);
            const mintRes = await fetch("/api/mint", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nftImage: imageUri,
                    address: account?.address || "",
                    prompt: imageDescription,
                    name: imageName,
                }),
            });

            if (!mintRes.ok) {
                throw new Error("Failed to mint NFT");
            }

            const mintedData = await mintRes.json();
            setMintedImage(imageUri);
            alert("NFT minted successfully");
        } catch (error) {
            console.error(error);
            alert(error);
        } finally {
            setIsMinting(false);
            refetchNFTs();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setUserImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setUserImagePreview(null);
        }
    };

    if (account) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
            }}>
                <ConnectButton
                    client={client}
                    chain={chain}
                />
                <div>
                    <div style={{ margin: "20px 0" }}>
                        {(generatedImage || userImagePreview) ? (
                            <MediaRenderer
                                client={client}
                                src={userImagePreview || generatedImage}
                                style={{
                                    width: "300px",
                                    height: "300px",
                                    borderRadius: "8px",
                                }}
                            />
                        ) : (
                            <div style={{
                                width: "300px",
                                height: "300px",
                                border: "1px dashed #777",
                                borderRadius: "10px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <p style={{ color: "#777" }}>
                                    {isGenerating ? "Generating image..." : "No image generated"}
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        <form onSubmit={handleGenerateAndMint}>
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}>
                                <label>
                                    <input
                                        type="radio"
                                        name="imageSource"
                                        value="ai"
                                        checked={useAIImage}
                                        onChange={() => setUseAIImage(true)}
                                    /> Use AI-generated imagee
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="imageSource"
                                        value="upload"
                                        checked={!useAIImage}
                                        onChange={() => setUseAIImage(false)}
                                    /> Upload your own image
                                </label>
                            </div>
                            {useAIImage ? (
                                <input
                                    type="text"
                                    placeholder="Enter image prompt..."
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    style={{
                                        width: "300px",
                                        height: "40px",
                                        padding: "0 10px",
                                        borderRadius: "5px",
                                        border: "1px solid #777",
                                        marginBottom: "10px",
                                    }}
                                />
                            ) : (
                                <input
                                    type="file"
                                    onChange={handleImageUpload}
                                    style={{
                                        marginBottom: "10px",
                                    }}
                                />
                            )}
                            <input
                                type="text"
                                placeholder="Enter NFT name..."
                                value={imageName}
                                onChange={(e) => setImageName(e.target.value)}
                                style={{
                                    width: "300px",
                                    height: "40px",
                                    padding: "0 10px",
                                    borderRadius: "5px",
                                    border: "1px solid #777",
                                    marginBottom: "10px",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Enter NFT description..."
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                                style={{
                                    width: "300px",
                                    height: "40px",
                                    padding: "0 10px",
                                    borderRadius: "5px",
                                    border: "1px solid #777",
                                    marginBottom: "10px",
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isGenerating || isMinting || (!imagePrompt && useAIImage) || (!userImage && !useAIImage)}
                                style={{
                                    width: "300px",
                                    height: "40px",
                                    backgroundColor: "#333",
                                    color: "#fff",
                                    borderRadius: "5px",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >{isGenerating ? "Generating..." : isMinting ? "Minting..." : "Generate and Mint"}</button>
                        </form>
                    </div>
                </div>
                {mintedImage && (
                    <div style={{
                        marginTop: "20px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "320px",
                    }}>
                        <h3>{imageName}</h3>
                        <img src={mintedImage} alt={imageName} style={{
                            width: "300px",
                            height: "300px",
                            borderRadius: "8px",
                            objectFit: "cover",
                        }} />
                        <p>{imageDescription}</p>
                    </div>
                )}
                <NFTCollection
                    nfts={nfts || []}
                />
            </div>
        );
    }
};
 
