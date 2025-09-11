import type { ColorProfile } from "../types/store.types";

const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = event.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
};

const extractColorsFromImage = async (
	img: HTMLImageElement,
): Promise<ColorProfile> => {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context not available");

	canvas.width = Math.min(img.width, 100);
	canvas.height = Math.min(img.height, 100);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = imageData.data;

	const colorMap = new Map<string, number>();
	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const color = `rgb(${r},${g},${b})`;
		colorMap.set(color, (colorMap.get(color) || 0) + 1);
	}

	const sortedColors = Array.from(colorMap.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([color]) => color);

	return {
		colors: sortedColors,
		dominantColor: sortedColors[0] || "rgb(0,0,0)",
		profile: "vibrant",
	};
};

export { createImageFromFile, extractColorsFromImage };
