import { chain } from "@/app/chain";
import { client } from "@/app/client";
import { getContract } from "thirdweb";

export const nftCollectionContractAddress = "0x3059a544fF0268174bdf13EaB471455175287652";

export const contract = getContract({
    client: client,
    chain: chain,
    address: nftCollectionContractAddress,
});