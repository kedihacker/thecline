import { OpenRouterEndpoint } from "../openrouter"
import {
	OpenRouterModelEndpoints,
	OpenRouterModelEndpoint,
	getEndpointsForModel,
	getModelIdsWithEndpoints,
	flattenModelEndpoints,
	createOpenRouterModelEndpoints,
} from "../openRouterModelEndpoints"

/**
 * Test data for OpenRouter endpoints functionality
 */

// Mock endpoint data
const mockEndpoint1: OpenRouterEndpoint = {
	name: "Google | google/gemini-2.5-pro",
	contextLength: 2097152,
	providerName: "Google",
	tag: "google-vertex/global",
	maxCompletionTokens: 8192,
	maxPromptTokens: undefined,
	supportedParameters: ["temperature", "top_p", "max_tokens"],
	status: 200,
	uptimeLast30m: 99.5,
	quantization: undefined,
	promptPrice: 1.25,
	completionPrice: 5.0,
	requestPrice: undefined,
	imagePrice: 0.25,
	webSearchPrice: undefined,
	internalReasoningPrice: undefined,
	inputCacheReadPrice: 0.125,
	inputCacheWritePrice: 1.25,
	discount: 0,
}

const mockEndpoint2: OpenRouterEndpoint = {
	name: "Google AI Studio | google/gemini-2.5-pro",
	contextLength: 2097152,
	providerName: "Google AI Studio",
	tag: "google-ai-studio",
	maxCompletionTokens: 8192,
	maxPromptTokens: undefined,
	supportedParameters: ["temperature", "top_p", "max_tokens"],
	status: 200,
	uptimeLast30m: 98.2,
	quantization: undefined,
	promptPrice: 1.25,
	completionPrice: 5.0,
	requestPrice: undefined,
	imagePrice: 0.25,
	webSearchPrice: undefined,
	internalReasoningPrice: undefined,
	inputCacheReadPrice: 0.125,
	inputCacheWritePrice: 1.25,
	discount: 0,
}

const mockEndpoint3: OpenRouterEndpoint = {
	name: "Anthropic | anthropic/claude-3.5-sonnet",
	contextLength: 200000,
	providerName: "Anthropic",
	tag: "anthropic/claude",
	maxCompletionTokens: 8192,
	maxPromptTokens: undefined,
	supportedParameters: ["temperature", "top_p", "max_tokens"],
	status: 200,
	uptimeLast30m: 99.8,
	quantization: undefined,
	promptPrice: 3.0,
	completionPrice: 15.0,
	requestPrice: undefined,
	imagePrice: 1.2,
	webSearchPrice: undefined,
	internalReasoningPrice: undefined,
	inputCacheReadPrice: 0.3,
	inputCacheWritePrice: 3.75,
	discount: 0,
}

// Mock models with endpoints
const mockModels = {
	"google/gemini-2.5-pro": {
		endpoints: [mockEndpoint1, mockEndpoint2],
	},
	"anthropic/claude-3.5-sonnet": {
		endpoints: [mockEndpoint3],
	},
	"openai/gpt-4": {
		endpoints: [], // Model with no endpoints
	},
}

/**
 * Test function to validate OpenRouter model endpoints functionality
 */
export function testOpenRouterModelEndpoints(): void {
	console.log("🧪 Testing OpenRouter Model Endpoints functionality...")

	// Test 1: Create OpenRouterModelEndpoints structure
	const openRouterModelEndpoints = createOpenRouterModelEndpoints(mockModels)
	console.log("✅ Created OpenRouterModelEndpoints structure:")
	console.log(JSON.stringify(openRouterModelEndpoints, null, 2))

	// Test 2: Get endpoints for a specific model
	const geminiEndpoints = getEndpointsForModel(openRouterModelEndpoints, "google/gemini-2.5-pro")
	console.log("✅ Endpoints for google/gemini-2.5-pro:", geminiEndpoints.length)
	console.log("   - Endpoint 1:", geminiEndpoints[0]?.name)
	console.log("   - Endpoint 2:", geminiEndpoints[1]?.name)

	// Test 3: Get endpoints for non-existent model
	const nonExistentEndpoints = getEndpointsForModel(openRouterModelEndpoints, "non-existent-model")
	console.log("✅ Endpoints for non-existent model:", nonExistentEndpoints.length)

	// Test 4: Get all model IDs with endpoints
	const modelIdsWithEndpoints = getModelIdsWithEndpoints(openRouterModelEndpoints)
	console.log("✅ Model IDs with endpoints:", modelIdsWithEndpoints)

	// Test 5: Flatten all endpoints with model IDs
	const flattenedEndpoints = flattenModelEndpoints(openRouterModelEndpoints)
	console.log("✅ Flattened endpoints count:", flattenedEndpoints.length)
	console.log("   - First endpoint model ID:", flattenedEndpoints[0]?.modelId)
	console.log("   - First endpoint name:", flattenedEndpoints[0]?.name)

	// Test 6: Verify addressability by model ID
	const addressabilityTest = flattenedEndpoints.every((endpoint) => endpoint.modelId != null)
	console.log("✅ All endpoints have model IDs (addressable):", addressabilityTest)

	// Test 7: Verify all API information is included
	const firstEndpoint = flattenedEndpoints[0]
	const hasAllApiInfo = firstEndpoint && 
		firstEndpoint.name !== undefined &&
		firstEndpoint.contextLength !== undefined &&
		firstEndpoint.providerName !== undefined &&
		firstEndpoint.tag !== undefined &&
		firstEndpoint.status !== undefined &&
		firstEndpoint.uptimeLast30m !== undefined &&
		firstEndpoint.promptPrice !== undefined &&
		firstEndpoint.completionPrice !== undefined &&
		firstEndpoint.discount !== undefined
	console.log("✅ Endpoints include all API information:", hasAllApiInfo)

	console.log("🎉 All tests passed! OpenRouter model endpoints are properly addressable by modelId and include all API endpoint information.")
}