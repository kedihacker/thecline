/**
 * OpenRouter API endpoint types
 */

export interface OpenRouterEndpoint {
	name: string
	contextLength: number
	providerName: string
	tag: string
	maxCompletionTokens?: number
	maxPromptTokens?: number
	supportedParameters: string[]
	status: number
	uptimeLast30m: number
	quantization?: string
	promptPrice?: number
	completionPrice?: number
	requestPrice?: number
	imagePrice?: number
	webSearchPrice?: number
	internalReasoningPrice?: number
	inputCacheReadPrice?: number
	inputCacheWritePrice?: number
	discount: number
}

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

export interface OpenRouterSelectedEndpoint {
	modelId: string
	endpointTag: string
}

export type OpenRouterSelectedEndpoints = Record<string, string> // modelId -> endpointTag

export interface OpenRouterEndpointsResponse {
	data: {
		id: string
		name: string
		description?: string
		architecture: {
			input_modalities?: string[]
			modality: string
			tokenizer: string
			instruct_type?: string
		}
		pricing: {
			prompt: string
			completion: string
			image?: string
			request?: string
		}
		context_length: number
		top_provider: {
			context_length: number
			max_completion_tokens?: number
			is_moderated: boolean
		}
		per_request_limits?: {
			prompt_tokens: string
			completion_tokens: string
		}
		endpoints?: Array<{
			name: string
			context_length: number
			provider_name: string
			tag: string
			max_completion_tokens?: number
			max_prompt_tokens?: number
			supported_parameters?: string[]
			status: number
			uptime_last_30m: number
			quantization?: string
			pricing?: {
				prompt?: string
				completion?: string
				request?: string
				image?: string
				web_search?: string
				internal_reasoning?: string
				input_cache_read?: string
				input_cache_write?: string
				discount?: number
			}
		}>
	}
}
