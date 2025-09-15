export interface CreatorProfile {
	id: string;
	storeName: string;
	storeSlug: string;
	firstName: string;
	lastName: string;
	email: string;
	avatar?: string;
	isActive: boolean;
}

export interface DashboardStats {
	totalEarnings: bigint;
	totalOrders: number;
	totalProducts: number;
	storeViews: number;
}

export interface QuickAction {
	title: string;
	description: string;
	icon: string;
	href: string;
}

export interface Product {
	id: string;
	name: string;
	price: bigint;
	image: string;
	category: string;
	specifications: string[];
	isBestseller?: boolean;
}

export interface Article {
	id: string;
	title: string;
	description: string;
	image: string;
	readTime: number;
	publishedAt: Date;
	category: string;
	href: string;
}

export interface DashboardData {
	creator: CreatorProfile;
	stats: DashboardStats;
	quickActions: QuickAction[];
	bestsellerProducts: Product[];
	featuredArticles: Article[];
}
