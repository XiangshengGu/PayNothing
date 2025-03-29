export interface VideoItem {
    id: string;
    title: string;
    username: string;
    description: string;
    uploadTime: number;
    likes: number;
    videoUrl: string;
    tags: ItemTag[];
}

export interface user {
    username: string;
    age: number;
    gender: string;
}

export enum ItemTag {
    ELECTRONICS = "Electronics",
    HOME_GOODS = "Home Goods",
    CLOTHING_ACCESSORIES = "Clothing & Accessories",
    BOOKS = "Books",
    SPORTS_OUTDOORS = "Sports & Outdoors",
    BABY_PRODUCTS = "Baby Products",
    AUTOMOTIVE = "Automotive",
    BEAUTY_PERSONAL_CARE = "Beauty & Personal Care",
    GAMES_TOYS = "Games & Toys",
    OTHER = "Other",
}