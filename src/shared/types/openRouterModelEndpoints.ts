import { OpenRouterEndpoint } from "./openrouter"

/**
 * Structure to store OpenRouter model endpoints, addressable by model ID
 */
export interface OpenRouterModelEndpoint extends OpenRouterEndpoint {
	modelId: string // Add model ID to make it addressable
}

/**
 * Collection of OpenRouter model endpoints, indexed by model ID for easy access
 */
export type OpenRouterModelEndpoints = Record<string, OpenRouterEndpoint[]>

/**
 * Helper function to get endpoints for a specific model ID
 * @param endpoints - The OpenRouterModelEndpoints collection
 * @param modelId - The model ID to look up
 * @returns Array of endpoints for the given model ID, or empty array if not found
 */
export function getEndpointsForModel(
	endpoints: OpenRouterModelEndpoints,
	modelId: string
): OpenRouterEndpoint[] {
	return endpoints[modelId] || []
}

/**
 * Helper function to get all model IDs that have endpoints
 * @param endpoints - The OpenRouterModelEndpoints collection
 * @returns Array of model IDs that have endpoints available
 */
export function getModelIdsWithEndpoints(endpoints: OpenRouterModelEndpoints): string[] {
	return Object.keys(endpoints)
}

/**
 * Helper function to flatten all endpoints with their model IDs
 * @param endpoints - The OpenRouterModelEndpoints collection
 * @returns Array of OpenRouterModelEndpoint with model IDs included
 */
export function flattenModelEndpoints(endpoints: OpenRouterModelEndpoints): OpenRouterModelEndpoint[] {
	const result: OpenRouterModelEndpoint[] = []
	for (const [modelId, modelEndpoints] of Object.entries(endpoints)) {
		for (const endpoint of modelEndpoints) {
			result.push({
				...endpoint,
				modelId,
			})
		}
	}
	return result
}

/**
 * Helper function to create OpenRouterModelEndpoints from a models collection
 * @param models - Record of model ID to ModelInfo containing endpoints
 * @returns OpenRouterModelEndpoints structure
 */
export function createOpenRouterModelEndpoints(
	models: Record<string, { endpoints?: OpenRouterEndpoint[] }>
): OpenRouterModelEndpoints {
	const result: OpenRouterModelEndpoints = {}
	for (const [modelId, modelInfo] of Object.entries(models)) {
		if (modelInfo.endpoints && modelInfo.endpoints.length > 0) {
			result[modelId] = modelInfo.endpoints
		}
	}
	return result
}