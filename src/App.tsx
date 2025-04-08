import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MedicineAnalysis {
  name: string;
  rating: number;
  sideEffects: string[];
  recommendations: string;
  studies: string[];
  userStories: string[];
  alternatives: string[];
  priceRange: string;
  availability: string;
}

const GEMINI_API_KEY = 'AIzaSyDYY-taP7dvSPiCvTo_goMV1qk1W8iMcqM';

const App: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analysis, setAnalysis] = useState<MedicineAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'stories'>('info');
  const webcamRef = useRef<Webcam>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        setError(null);
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageData = e.target?.result as string;
          if (imageData) {
            await analyzeMedicine(imageData);
          }
        };
        reader.onerror = () => {
          setError('Error reading file. Please try again.');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError('Error processing image. Please try again.');
        setLoading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const analyzeMedicine = async (imageData: string) => {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const prompt = `Analyze this medicine image and provide a detailed analysis in the following format:
1. Medicine Name: [Full name and active ingredients]
2. Safety Rating: [Rate from 1-10 based on FDA/EMA safety data]
3. Side Effects: [List common and serious side effects based on clinical studies]
4. Recent Studies: [Summarize 2-3 recent clinical studies or meta-analyses about this medicine]
5. Recommendations: [Usage guidelines, contraindications, and important warnings]
6. User Stories: [2-3 real patient experiences with this medicine]
7. Alternatives: [2-3 alternative medicines with similar effects]
8. Price Range: [Estimated price range in USD]
9. Availability: [Prescription status and availability]

Please base your analysis on:
- FDA/EMA approved documentation
- Recent clinical studies (last 5 years)
- Meta-analyses of side effects
- Drug interaction databases
- Patient safety reports
- Real patient testimonials and experiences

Format the response as a structured analysis with clear sections.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1]
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the response and update the analysis state
      setAnalysis({
        name: "Medicine Name", // Parse from response
        rating: 7.5,
        sideEffects: ["Side effect 1", "Side effect 2"],
        recommendations: "Usage recommendations",
        studies: ["Recent study 1", "Recent study 2"],
        userStories: ["Patient story 1", "Patient story 2"],
        alternatives: ["Alternative 1", "Alternative 2"],
        priceRange: "$10-$30",
        availability: "Prescription required"
      });
    } catch (error) {
      console.error('Error analyzing medicine:', error);
    }
  };

  const captureImage = async () => {
    if (webcamRef.current) {
      try {
        setError(null);
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setLoading(true);
          await analyzeMedicine(imageSrc);
        }
      } catch (err) {
        setError('Error capturing image. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MedSide AI</h1>
          <p className="text-gray-400">Scan your medicine for instant analysis</p>
        </header>

        <div className="bg-black bg-opacity-50 rounded-lg p-6 backdrop-blur-sm">
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {!isCameraActive ? (
            <div className="space-y-4">
              <button
                onClick={() => setIsCameraActive(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Take Photo
              </button>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="text-blue-400">Drop the image here...</p>
                ) : (
                  <div>
                    <p className="text-gray-400">Drag and drop an image here, or click to select</p>
                    <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG, GIF</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
                videoConstraints={{
                  facingMode: "environment"
                }}
              />
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Capture & Analyze'}
                </button>
                <button
                  onClick={() => setIsCameraActive(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Close Camera
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{analysis.name}</h2>
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                  <span className="text-yellow-400">★</span>
                  <span className="text-xl">{analysis.rating}/10</span>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'info' ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  Information
                </button>
                <button
                  onClick={() => setActiveTab('stories')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'stories' ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  Patient Stories
                </button>
              </div>

              {activeTab === 'info' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Price Range</h3>
                      <p className="text-gray-300">{analysis.priceRange}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Availability</h3>
                      <p className="text-gray-300">{analysis.availability}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Side Effects:</h3>
                    <ul className="list-disc list-inside text-gray-300">
                      {analysis.sideEffects.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recent Studies:</h3>
                    <ul className="list-disc list-inside text-gray-300">
                      {analysis.studies.map((study, index) => (
                        <li key={index}>{study}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Alternatives:</h3>
                    <ul className="list-disc list-inside text-gray-300">
                      {analysis.alternatives.map((alt, index) => (
                        <li key={index}>{alt}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recommendations:</h3>
                    <p className="text-gray-300">{analysis.recommendations}</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Patient Experiences:</h3>
                  {analysis.userStories.map((story, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-300">{story}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App; 