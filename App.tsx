
import React, { useState, useCallback, useRef } from 'react';
import { generateImages } from './services/geminiService';
import ImageCard from './components/ImageCard';
import Modal from './components/Modal';
import { AspectRatio, GeneratedImage } from './types';
// import { v4 as uuidv4 } from 'uuid'; // For unique IDs if `uuid` is installed

// Helper function to simulate UUID generation if `uuid` is not installed
const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT_PHONE);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [remixReferenceImageBase64, setRemixReferenceImageBase64] = useState<string | null>(null);
  const [remixPrompt, setRemixPrompt] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    // Clear remix reference if user explicitly starts a new generation
    if (!remixReferenceImageBase64) {
      setRemixPrompt(''); // Clear remix prompt if not actively remixing
    }

    try {
      const images = await generateImages({
        prompt: remixReferenceImageBase64 ? remixPrompt : prompt, // Use remix prompt if remixing, otherwise current prompt
        aspectRatio: selectedAspectRatio,
        referenceImageBase64: remixReferenceImageBase64,
      });

      const newGeneratedImages: GeneratedImage[] = images.map((url) => ({
        id: generateUniqueId(),
        url,
        prompt: remixReferenceImageBase64 ? remixPrompt : prompt,
        aspectRatio: selectedAspectRatio,
        remixedFrom: remixReferenceImageBase64 || undefined,
      }));

      setGeneratedImages(newGeneratedImages);
      setRemixReferenceImageBase64(null); // Clear remix reference after generating new batch
      setRemixPrompt(''); // Clear remix prompt
      setPrompt(remixReferenceImageBase64 ? remixPrompt : prompt); // Keep the current prompt in the input field
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, selectedAspectRatio, remixReferenceImageBase64, remixPrompt]);

  const handleOpenModal = useCallback((image: GeneratedImage) => {
    setSelectedImage(image);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleDownload = useCallback((imageUrl: string, imagePrompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `wallpaper-${imagePrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleRemix = useCallback((image: GeneratedImage) => {
    setRemixReferenceImageBase64(image.url);
    setRemixPrompt(image.prompt); // Set the prompt to the original prompt of the remixed image
    setPrompt(image.prompt); // Also update the input field
    setSelectedAspectRatio(image.aspectRatio); // Keep the same aspect ratio for remix
    handleCloseModal(); // Close the modal
    // Trigger generate immediately, or prompt user to click generate again
    // For now, let's just set the state and allow user to click generate
  }, [handleCloseModal]);

  const handleClearRemix = useCallback(() => {
    setRemixReferenceImageBase64(null);
    setRemixPrompt('');
    setPrompt(''); // Clear the prompt input field as well
  }, []);

  // Use a ref for the input element to ensure correct focus handling, if needed.
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Set initial prompt for remixing if a remix reference is set
  React.useEffect(() => {
    if (remixReferenceImageBase64 && promptInputRef.current) {
      promptInputRef.current.focus();
      setPrompt(remixPrompt); // Update prompt input with the remix prompt
    }
  }, [remixReferenceImageBase64, remixPrompt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        AI Wallpaper Studio
      </h1>

      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-gray-300 text-sm font-bold mb-2">
            Describe your desired vibe:
          </label>
          <input
            ref={promptInputRef}
            id="prompt"
            type="text"
            className="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 placeholder-gray-400 text-base"
            value={remixReferenceImageBase64 ? remixPrompt : prompt}
            onChange={(e) => remixReferenceImageBase64 ? setRemixPrompt(e.target.value) : setPrompt(e.target.value)}
            placeholder="e.g., rainy cyberpunk lo-fi, enchanted forest at sunset"
            disabled={loading}
          />
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="aspectRatio" className="block text-gray-300 text-sm font-bold mb-2">
              Aspect Ratio:
            </label>
            <select
              id="aspectRatio"
              className="shadow border border-gray-600 rounded w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-base"
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value as AspectRatio)}
              disabled={loading}
            >
              {Object.values(AspectRatio).map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                  {ratio === AspectRatio.PORTRAIT_PHONE && ' (Phone Wallpaper)'}
                  {ratio === AspectRatio.SQUARE && ' (Square)'}
                  {ratio === AspectRatio.LANDSCAPE_WIDESCREEN && ' (Widescreen)'}
                  {ratio === AspectRatio.PORTRAIT_TABLET && ' (Portrait Tablet)'}
                  {ratio === AspectRatio.LANDSCAPE_TABLET && ' (Landscape Tablet)'}
                </option>
              ))}
            </select>
          </div>
          {remixReferenceImageBase64 && (
            <div className="mt-4 sm:mt-0 p-3 bg-purple-700/30 border border-purple-500 rounded-md text-sm text-purple-200 flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xl">✨</span>
              <span>Remixing from current image.</span>
              <button
                onClick={handleClearRemix}
                className="text-purple-200 hover:text-white ml-2 text-lg"
                aria-label="Clear remix reference"
              >
                &times;
              </button>
            </div>
          )}
        </div>


        <button
          onClick={handleGenerate}
          className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-all duration-300 ${
            loading
              ? 'bg-purple-600/50 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900'
          }`}
          disabled={loading || (!remixReferenceImageBase64 && !prompt.trim())}
        >
          {loading ? 'Generating...' : (remixReferenceImageBase64 ? 'Remix & Generate' : 'Generate Wallpapers')}
        </button>

        {error && (
          <p className="text-red-400 text-center mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md">
            Error: {error}
          </p>
        )}
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {generatedImages.map((image) => (
          <ImageCard key={image.id} image={image} onClick={handleOpenModal} />
        ))}
      </div>

      <Modal isOpen={!!selectedImage} onClose={handleCloseModal}>
        {selectedImage && (
          <div className="flex flex-col items-center">
            <img
              src={selectedImage.url}
              alt={selectedImage.prompt}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl mb-4 md:mb-6"
            />
            <p className="text-gray-300 text-center mb-4 text-md md:text-lg">
              "{selectedImage.prompt}"
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDownload(selectedImage.url, selectedImage.prompt)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Download
              </button>
              <button
                onClick={() => handleRemix(selectedImage)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Remix
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;
    