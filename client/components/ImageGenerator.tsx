import React, { useState } from "react";
import {
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  ImageIcon,
  Maximize2,
} from "lucide-react";
import { generateMarketingImage } from "../services/geminiService";
import { AspectRatio, ImageSize } from "../types/types";

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateMarketingImage({
        prompt,
        size,
        aspectRatio,
      });
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `classly-marketing-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            Marketing AI
          </h2>
          <p className="text-slate-500">
            Generate professional high-resolution posters and social media
            assets for your studio.
          </p>
        </div>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
          Powered by Gemini 3 Pro
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Image Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A vibrant ballet class with 5 students in a sunlit studio, professional photography style..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-40 resize-none text-sm transition-shadow"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resolution
                </label>
                <div className="relative">
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as ImageSize)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
                  >
                    <option value="1K">1K (Standard)</option>
                    <option value="2K">2K (High Res)</option>
                    <option value="4K">4K (Ultra HD)</option>
                  </select>
                  <Maximize2
                    className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) =>
                    setAspectRatio(e.target.value as AspectRatio)
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="3:4">3:4 (Portrait)</option>
                  <option value="4:3">4:3 (Landscape)</option>
                  <option value="16:9">16:9 (Cinema)</option>
                  <option value="9:16">9:16 (Story)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                isGenerating || !prompt.trim()
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Asset
                </>
              )}
            </button>

            {/* Disclaimer */}
            <p className="text-xs text-slate-400 text-center">
              Using 2K or 4K resolution may take slightly longer to generate.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
              <AlertCircle size={14} />
              Pro Tip
            </h4>
            <p className="text-xs text-blue-700">
              Be specific about lighting (e.g., "cinematic lighting", "golden
              hour") and style (e.g., "photorealistic", "illustration") for best
              results.
            </p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div
            className={`w-full aspect-square md:aspect-[4/3] rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden bg-slate-50 transition-all ${
              generatedImage
                ? "border-transparent shadow-xl"
                : "border-slate-300"
            }`}
          >
            {error ? (
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">
                  Generation Failed
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 text-indigo-600 font-medium text-sm hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : generatedImage ? (
              <div className="relative w-full h-full group">
                <img
                  src={generatedImage}
                  alt="Generated marketing asset"
                  className="w-full h-full object-contain bg-black/5"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-medium hover:bg-slate-100 transition-colors shadow-lg"
                  >
                    <Download size={20} />
                    Download {size}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400">
                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">
                      Creating masterpiece...
                    </p>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No image generated yet</p>
                    <p className="text-sm mt-1">
                      Configure options and click generate
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 px-2">
              <span className="flex items-center gap-1">
                Generated with <strong>Gemini 3 Pro</strong>
              </span>
              <span>
                {size} • {aspectRatio}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
