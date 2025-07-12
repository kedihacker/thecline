import { Controller } from ".."
import { StringRequest } from "../../../shared/proto/common"
import { OpenRouterCompatibleModelInfo, OpenRouterModelInfo, OpenRouterEndpoint } from "../../../shared/proto/models"
import axios from "axios"
import path from "path"
import fs from "fs/promises"
import { fileExistsAtPath } from "@utils/fs"
import { GlobalFileNames } from "@core/storage/disk"

/**
 * Refreshes the OpenRouter endpoints for a specific model and returns updated values
 * @param controller The controller instance
 * @param request Request containing the model ID to refresh endpoints for
 * @returns Response containing the updated OpenRouter model information
 */
export async function refreshOpenRouterEndpoints(
	controller: Controller,
	request: StringRequest,
): Promise<OpenRouterCompatibleModelInfo> {
	const modelId = request.value
	if (!modelId) {
		throw new Error("Model ID is required")
	}

	const openRouterModelsFilePath = path.join(await ensureCacheDirectoryExists(controller), GlobalFileNames.openRouterModels)

	let models: Record<string, OpenRouterModelInfo> = {}
	try {
		// Get the endpoints for the specific model from the API (don't URL encode the modelId)
		const response = await axios.get(`https://openrouter.ai/api/v1/models/${modelId}/endpoints`)

		if (response.data?.data) {
			const modelData = response.data.data
			const parsePrice = (price: any) => {
				if (price) {
					return parseFloat(price) * 1_000_000
				}
				return undefined
			}

			// Process all endpoints and store their information
			const endpoints: OpenRouterEndpoint[] = []
			if (modelData.endpoints && Array.isArray(modelData.endpoints)) {
				for (const endpoint of modelData.endpoints) {
					const endpointInfo = OpenRouterEndpoint.create({
						name: endpoint.name || "",
						contextLength: endpoint.context_length || 0,
						providerName: endpoint.provider_name || "",
						tag: endpoint.tag || "",
						maxCompletionTokens: endpoint.max_completion_tokens,
						maxPromptTokens: endpoint.max_prompt_tokens,
						supportedParameters: endpoint.supported_parameters || [],
						status: endpoint.status || 0,
						uptimeLast30m: endpoint.uptime_last_30m || 0,
						quantization: endpoint.quantization,
						promptPrice: parsePrice(endpoint.pricing?.prompt),
						completionPrice: parsePrice(endpoint.pricing?.completion),
						requestPrice: parsePrice(endpoint.pricing?.request),
						imagePrice: parsePrice(endpoint.pricing?.image),
						webSearchPrice: parsePrice(endpoint.pricing?.web_search),
						internalReasoningPrice: parsePrice(endpoint.pricing?.internal_reasoning),
						inputCacheReadPrice: parsePrice(endpoint.pricing?.input_cache_read),
						inputCacheWritePrice: parsePrice(endpoint.pricing?.input_cache_write),
						discount: endpoint.pricing?.discount || 0,
					})
					endpoints.push(endpointInfo)
				}
			}

			// Get the best endpoint (first one or one with highest context length) for backward compatibility
			const bestEndpoint =
				modelData.endpoints?.length > 0
					? modelData.endpoints.reduce((best: any, current: any) =>
							(current.context_length || 0) > (best.context_length || 0) ? current : best,
						)
					: null

			const modelInfo = OpenRouterModelInfo.create({
				maxTokens: bestEndpoint?.max_completion_tokens ?? bestEndpoint?.context_length ?? 0,
				contextWindow: bestEndpoint?.context_length ?? 0,
				supportsImages: modelData.architecture?.input_modalities?.includes("image") ?? false,
				supportsPromptCache: false,
				inputPrice: parsePrice(bestEndpoint?.pricing?.prompt) ?? 0,
				outputPrice: parsePrice(bestEndpoint?.pricing?.completion) ?? 0,
				cacheWritesPrice: 0,
				cacheReadsPrice: 0,
				description: modelData.description ?? "",
				thinkingConfig: undefined,
				supportsGlobalEndpoint: undefined,
				tiers: [],
				endpoints: [], // Endpoints are now managed separately
			})

			// Apply model-specific configurations (same logic as refreshOpenRouterModels)
			switch (modelData.id || modelId) {
				case "anthropic/claude-sonnet-4":
				case "anthropic/claude-opus-4":
				case "anthropic/claude-3-7-sonnet":
				case "anthropic/claude-3-7-sonnet:beta":
				case "anthropic/claude-3.7-sonnet":
				case "anthropic/claude-3.7-sonnet:beta":
				case "anthropic/claude-3.7-sonnet:thinking":
				case "anthropic/claude-3.5-sonnet":
				case "anthropic/claude-3.5-sonnet:beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 3.75
					modelInfo.cacheReadsPrice = 0.3
					break
				case "anthropic/claude-3.5-sonnet-20240620":
				case "anthropic/claude-3.5-sonnet-20240620:beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 3.75
					modelInfo.cacheReadsPrice = 0.3
					break
				case "anthropic/claude-3-5-haiku":
				case "anthropic/claude-3-5-haiku:beta":
				case "anthropic/claude-3-5-haiku-20241022":
				case "anthropic/claude-3-5-haiku-20241022:beta":
				case "anthropic/claude-3.5-haiku":
				case "anthropic/claude-3.5-haiku:beta":
				case "anthropic/claude-3.5-haiku-20241022":
				case "anthropic/claude-3.5-haiku-20241022:beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 1.25
					modelInfo.cacheReadsPrice = 0.1
					break
				case "anthropic/claude-3-opus":
				case "anthropic/claude-3-opus:beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 18.75
					modelInfo.cacheReadsPrice = 1.5
					break
				case "anthropic/claude-3-haiku":
				case "anthropic/claude-3-haiku:beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 0.3
					modelInfo.cacheReadsPrice = 0.03
					break
				case "deepseek/deepseek-chat":
					modelInfo.supportsPromptCache = true
					modelInfo.inputPrice = 0
					modelInfo.cacheWritesPrice = 0.14
					modelInfo.cacheReadsPrice = 0.014
					break
				case "x-ai/grok-3-beta":
					modelInfo.supportsPromptCache = true
					modelInfo.cacheWritesPrice = 0.75
					modelInfo.cacheReadsPrice = 0
					break
				default:
					if ((modelData.id || modelId).startsWith("openai/")) {
						// For OpenAI models, check if endpoint has cache pricing
						modelInfo.cacheReadsPrice = parsePrice(bestEndpoint?.pricing?.input_cache_read)
						if (modelInfo.cacheReadsPrice) {
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = parsePrice(bestEndpoint?.pricing?.input_cache_write)
						}
					} else if ((modelData.id || modelId).startsWith("google/")) {
						// For Google models, check if endpoint has cache pricing
						modelInfo.cacheReadsPrice = parsePrice(bestEndpoint?.pricing?.input_cache_read)
						if (modelInfo.cacheReadsPrice) {
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = parsePrice(bestEndpoint?.pricing?.input_cache_write)
						}
					}
					break
			}

			models[modelId] = modelInfo

			// Update the cached models file with the new information
			const cachedModels = await readOpenRouterModels(controller)
			if (cachedModels) {
				// Merge the updated model info with existing cached models
				const updatedModels = { ...cachedModels, [modelId]: modelInfo }
				await fs.writeFile(openRouterModelsFilePath, JSON.stringify(updatedModels))
				console.log(`OpenRouter model ${modelId} endpoints refreshed and cached`)
			} else {
				// If no cached models exist, just save this one model
				await fs.writeFile(openRouterModelsFilePath, JSON.stringify(models))
				console.log(`OpenRouter model ${modelId} endpoints refreshed and saved`)
			}
		} else {
			console.error(`Invalid response from OpenRouter API for model ${modelId}`)
			throw new Error(`Failed to fetch model information for ${modelId}`)
		}
	} catch (error) {
		console.error(`Error fetching OpenRouter model ${modelId}:`, error)

		// If we failed to fetch the specific model, try to get it from cached models
		const cachedModels = await readOpenRouterModels(controller)
		if (cachedModels && cachedModels[modelId]) {
			models[modelId] = cachedModels[modelId]
			console.log(`Using cached model information for ${modelId}`)
		} else {
			throw new Error(`Failed to refresh endpoints for model ${modelId} and no cached data available`)
		}
	}

	return OpenRouterCompatibleModelInfo.create({ models })
}

/**
 * Reads cached OpenRouter models from disk
 */
async function readOpenRouterModels(controller: Controller): Promise<Record<string, OpenRouterModelInfo> | undefined> {
	const openRouterModelsFilePath = path.join(await ensureCacheDirectoryExists(controller), GlobalFileNames.openRouterModels)
	const fileExists = await fileExistsAtPath(openRouterModelsFilePath)
	if (fileExists) {
		try {
			const fileContents = await fs.readFile(openRouterModelsFilePath, "utf8")
			return JSON.parse(fileContents)
		} catch (error) {
			console.error("Error reading cached OpenRouter models:", error)
			return undefined
		}
	}
	return undefined
}

/**
 * Ensures the cache directory exists and returns its path
 */
async function ensureCacheDirectoryExists(controller: Controller): Promise<string> {
	const cacheDir = path.join(controller.context.globalStorageUri.fsPath, "cache")
	await fs.mkdir(cacheDir, { recursive: true })
	return cacheDir
}
