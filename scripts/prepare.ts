type DistPackageJson = {
	[key: string]: unknown;
	name?: string;
	version?: string;
	type?: string;
	author?: string;
	license?: string;
	description?: string;
	repository?: string;
	bugs?: string;
	homepage?: string;
	keywords?: string[];
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	main?: string;
	types?: string;
	exports?: {
		import: {
			types: string;
			import: string;
		};
		require: {
			types: string;
			require: string;
		};
	};
};

const preparePackage = async () => {
	try {
		// Read the original package.json
		const packageJson = JSON.parse(await Bun.file("package.json").text());

		// List of essential fields to copy from the original package.json
		const essentialFields = [
			"name",
			"version",
			"type",
			"author",
			"license",
			"description",
			"repository",
			"bugs",
			"homepage",
			"keywords",
			"dependencies",
			"peerDependencies",
		];

		// Create a new object to hold the filtered package.json data
		const distPackageJson: DistPackageJson = {};

		// Copy over only the essential fields
		for (const field of essentialFields) {
			if (packageJson[field]) {
				distPackageJson[field] = packageJson[field];
			}
		}
		// Add additional fields for the distribution package.json
		distPackageJson.main = "./index.js";
		distPackageJson.types = "./index.d.ts";
		distPackageJson.exports = {
			import: {
				types: "./index.d.ts",
				import: "./index.js",
			},
			require: {
				types: "./index.d.cts",
				require: "./index.cjs",
			},
		};

		// Write the new package.json to the dist folder
		await Bun.write(
			"dist/package.json",
			JSON.stringify(distPackageJson, null, 2),
		);

		// Copy README and LICENSE files to the dist folder
		await Bun.write(
			"./dist/README.md",
			await Bun.file("./README.md").arrayBuffer(),
		);
		await Bun.write(
			"./dist/LICENSE",
			await Bun.file("./LICENSE").arrayBuffer(),
		);

		console.log("Package prepared for publishing successfully!");
	} catch (error) {
		console.error("An error occurred during prepublish:", error);
	}
};

// Run the preparePackage function
preparePackage();
