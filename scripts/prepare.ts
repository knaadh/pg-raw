const preparePackage = async () => {
	try {
		// Read the original package.json
		const packageJson = JSON.parse(await Bun.file("package.json").text());

		// Extract essential fields
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

		const distPackageJson: Record<string, unknown> = {};
		for (const field of essentialFields) {
			if (packageJson[field]) {
				distPackageJson[field] = packageJson[field];
			}
		}

		// biome-ignore lint/complexity/useLiteralKeys: <explanation>
		distPackageJson["main"] = "./index.js";
		// biome-ignore lint/complexity/useLiteralKeys: <explanation>
		distPackageJson["types"] = "./index.d.ts";
		// biome-ignore lint/complexity/useLiteralKeys: <explanation>
		distPackageJson["exports"] = {
			import: {
				types: "./index.d.ts",
				import: "./index.js",
			},
			require: {
				types: "./index.d.cts",
				require: "./index.cjs",
			},
		};
		// Write the new package.json to dist folder
		await Bun.write(
			"dist/package.json",
			JSON.stringify(distPackageJson, null, 2),
		);

		// Copy README and LICENCE to dist folder
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

preparePackage();
