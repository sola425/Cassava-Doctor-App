
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, ChevronLeft, X, Leaf, Globe } from 'lucide-react';
import { LayersModel, loadLayersModel, ready, browser, scalar, Tensor, dispose } from '@tensorflow/tfjs';

// --- Constants ---
const IMAGE_SIZE = 224;
// Note: These paths assume the files are in the 'public' folder (served at root)
const MODEL_URL = './model.json';
const METADATA_URL = './tm_metadata.json';

// --- Data: Multilingual Disease Info ---
type Language = 'en' | 'yo' | 'ha' | 'ig';

const LANGUAGES: {id: Language, label: string}[] = [
  { id: 'en', label: 'English' },
  { id: 'yo', label: 'Yoruba' },
  { id: 'ha', label: 'Hausa' },
  { id: 'ig', label: 'Igbo' },
];

const DISEASE_INFO: Record<string, Record<Language, string>> = {
  'Cassava Healthy': {
    en: "DIAGNOSIS:\nExcellent! Your plant looks healthy and strong. The leaves are deep green, fully open, and free from spots or curling. The stems are robust.\n\nMAINTENANCE & CARE:\n• Weed Control: Keep the farm free of weeds to ensure your cassava gets all the nutrients.\n• Soil Health: Add manure or fertilizer if the leaves look pale.\n• Monitoring: Check your farm once a week to catch any early signs of trouble.",
    yo: "AYEWO:\nIroyin ayo! Ege yii da, o ni ilera. Ewe re dudu daada, ko si roro, ko yi, ko si ni aapa kankan. Igi re tamba.\n\nITOJU FUN AGBA:\n• Wiwa Oko: E ma wa oko ni asiko ki igbo ma gba ounje lowo ege.\n• Ajile: E lo ajile tabi omi dudu ti ile ko ba lera.\n• Ibojuto: E ma de oko leekan lose lati ri pe ko si kokoro kankan.",
    ha: "BINCIKE:\nAlbishirinku! Wannan rogo yana da lafiya sosai. Ganyen yana da koren launi mai kyau, ya buɗe, babu lankwashewa ko dige-dige na cuta.\n\nKULAWA:\n• Noma: Ci gaba da yin noma akan lokaci don kada ciyawa ta sha taki.\n• Taki: Sanya taki idan ƙasa ta gaji don ƙara ƙarfin ƙasa.\n• Dubawa: Riƙa duba gonar mako-mako don ganin ko akwai kwari.",
    ig: "NCHỌPỤTA:\nOzi ọma! Akpụ a dị mma ma sie ike. Akwụkwọ ya na-acha akwụkwọ ndụ akwụkwọ ndụ nke ọma. Ọ nweghị ntụpọ, ọ naghị acha odo odo, ma ọ bụ ịkpụkọta akpụkọta.\n\nNLEKỌTA:\n• Sụọ Ahịhịa: Nọgide na-asụ ahịhịa oge niile ka ọ ghara ịna-eri nri akpụ.\n• Fatịlaịza: Tinye fatịlaịza kwesịrị ekwesị ma ọ bụrụ na ala adịghị mma.\n• Nlele: Na-eleba anya n'ugbo gị kwa izu iji chọpụta ma enwere nsogbu."
  },
  'Cassava mosaic disease': {
    en: "DIAGNOSIS (CMD):\nThis is the most common disease. Look for patches of yellow and green mixing on the leaves (mosaic pattern). The leaves often curl, twist, and become smaller (stunted). The plant may not produce good tubers.\n\nMANAGEMENT PLAN:\n1. Rogueing: Pull up the infected plant completely by the roots immediately. Do not leave it in the farm.\n2. Burn It: Burn the uprooted plant away from the farm to kill the whiteflies hiding in it.\n3. Replanting: When planting next time, use resistant stems like TME 419.\n4. Hygiene: Keep the farm weed-free to reduce whiteflies that carry the disease.",
    yo: "AYEWO (CMD):\nEyi ni arun ti o wopo ju. E o ri pe awo ofeefee ati alawo ewe dapo lara ewe (bi aworan). Ewe a roro, a yi, a si kere. Igi ko ni dagba daada, isu re ko ni tobi.\n\nOHUN TI E LE SE:\n1. Fa Tu: E fa gbogbo ege to ni arun yii tu patapata lati gbongbo.\n2. Sun Un: E sun awon igi ti e fa tu yii ki kokoro funfun ti o n tan arun yii le ku.\n3. Igi Gbingbin: E lo awon irugbin ti arun ko le mu (bii TME 419) fun gbingbin miiran.\n4. Imototo: E wa oko daada lati dinku kokoro funfun.",
    ha: "BINCIKE (CMD):\nWannan cutar tana sa ganye ya yi launin rawaya da kore. Ganyen yana curewa, yana kankancewa, kuma yana lankwashewa. Iccen ba ya girma sosai kuma rogon ba zai yi kyau ba.\n\nABIN YI:\n1. Cirewa: Cire duk rogon da ke da cutar nan da nan daga saiwa.\n2. Konewa: Ɗauke rogon da aka cire a kone shi nesa da gona.\n3. Iri Mai Kyau: Yi amfani da iri mai jure cutar (kamar TME 419) wajen shuka na gaba.\n4. Tsafta: Tsaftace gona daga ciyawa don rage yawan farar ƙuda masu ɗaukar cutar.",
    ig: "NCHỌPỤTA (CMD):\nNke a bụ ọrịa a na-ahụkarị. Ị ga-ahụ na akwụkwọ ya na-acha odo odo na akwụkwọ ndụ, na-akpụkọta akpụkọta ma dị pere mpe. Osisi anaghịkwa eto ofuma, ji ya anaghị ekwe.\n\nIHE Ị GA-EME:\n1. Wepụ Ozugbo: Wepụ osisi ahụ nwere ọrịa kpamkpam site na mgbọrọgwụ.\n2. Kpọọ Ọkụ: Kpọọ osisi ndị ahụ ọkụ n'ebe dị anya ka ụmụ ahụhụ ghara ife.\n3. Mkpụrụ Dị Mma: Jiri naanị mkpụrụ osisi na-anaghị anwụ anwụ (dịka TME 419) kụọ ọzọ.\n4. Ịdị Ọcha: Debe ugbo ọcha ka ụmụ ahụhụ ghara ịba ụba."
  },
  'Cassava bacterial blight': {
    en: "DIAGNOSIS (CBB):\nLook for angular spots on leaves that look like they are soaked in water. These spots turn brown and the leaves wither/die, appearing scorched by fire. The stems may ooze a sticky liquid, and the plant dies from the top downwards ('Candlestick' appearance).\n\nMANAGEMENT PLAN:\n1. Pruning: Cut off the infected branches using a clean knife. Dip the knife in bleach or pass it through fire between cuts.\n2. Clean Up: Gather all fallen dead leaves and burn them. Do not leave it in the farm.\n3. Crop Rotation: Do not plant cassava on this land next season. Plant maize or beans instead to starve the bacteria.\n4. Selection: Never take stems from a farm that has this disease.",
    yo: "AYEWO (CBB):\nE o ri pe ewe n ro bi eni pe omi gbona da si. Ewe a wa di dudu bi eni pe ina jo o. Omi ti o nipon a ma jade lara igi, igi a si bere si ku lati oke wa (bi opa fitila).\n\nOHUN TI E LE SE:\n1. Gige: E ge awon ibi ti arun wa kuro pelu obe ti e ti fi ina tabi oogun ko.\n2. Sisun: E ko gbogbo ewe ati igi ti e ge kuro, ki e si sun won.\n3. Yiyi Oko: E ma gbin ege si ibi kan naa leralera; e gbin agbado tabi ewa si be ni odun to n bo.\n4. Igi Gbingbin: E ma gba igi lati ara ege ti o ni arun yii rara.",
    ha: "BINCIKE (CBB):\nZa a ga dige-dige kamar na ruwan zafi a ganye wanda ke komawa launin kasa kamar wuta ta kone shi. Ruwa yana fita daga jikin iccen, kuma yana bushewa daga sama zuwa kasa.\n\nABIN YI:\n1. Yankewa: Yanke sassan da suka lalace da wuka mai tsabta (a sa wuka a wuta ko ruwan bleach).\n2. Kone Shara: Tara duk ganyen da ya zube a kone; kar a bar shi a gona.\n3. Canza Shuka: Kar a sake shuka rogo a wajen a shekara mai zuwa; a shuka masara ko wake.\n4. Kariya: Kada a ɗauki irin rogo daga gonar da ke da wannan cutar.",
    ig: "NCHỌPỤTA (CBB):\nỊ ga-ahụ ntụpọ mmiri na akwụkwọ nke na-emesịa gbanwee nchara nchara dịka ọkụ ọ gbara ya. Akwụkwọ na-akpọnwụ site n'elu na-agbada, mmiri na-esikwa n'osisi apụta.\n\nIHE Ị GA-EME:\n1. Bechapụ: Jiri mma dị ọcha bepụ ebe ndị nwere ọrịa (jiri ọkụ kpoo mma ahụ).\n2. Kpọọ Ọkụ: Kpọọ irighiri osisi na akwụkwọ ndị ahụ ọkụ; ahapụla ha n'ugbo.\n3. Ịkụ Ihe Ọzọ: Akụla akpụ n'otu ebe ahụ n'oge ọzọ. Kụọ ọka ma ọ bụ agwa.\n4. Mkpụrụ Dị Ọcha: Ejila osisi sitere n'ugbo nwere ọrịa a akụ ihe."
  },
  'Cassava green mottle': {
    en: "DIAGNOSIS (CGM):\nThe leaves show faint to distinct green patterns (mottle), but unlike Mosaic disease, the leaves are usually NOT twisted or stunted. The plant looks mostly normal, but the yield will be poor if ignored.\n\nMANAGEMENT PLAN:\n1. Isolation: Dig up the affected plant immediately so it does not spread to others.\n2. Weed Control: Many weeds carry this virus. Keep your farm very clean.\n3. Tool Hygiene: Wash your cutlasses and hoes regularly, as they can transfer the virus.\n4. Healthy Starts: Only use stems from plants you are sure are healthy.",
    yo: "AYEWO (CGM):\nArun yii ma n fa awon ami awo ewe ti o dabi aworan lara ewe, sugbon ewe KO ni roro tabi yi bii ti Mosaic. Igi le jo pe o wa daada, sugbon isu re ko ni po.\n\nOHUN TI E LE SE:\n1. Gbigbe Kuro: E fa gbogbo awon ti o ti ni arun kuro ni kiakia ki e si sun won.\n2. Isakoso Igbo: E wa oko daada lati yo awon igbo ti o le gbe arun yii.\n3. Imototo: E ma fo awon ohun elo oko yin (ada, oko) daada.\n4. Yiyan Igi: E yan igi ti o da daada nikan fun gbingbin.",
    ha: "BINCIKE (CGM):\nWannan cuta ce mai sa ganyen rogo ya yi launi iri-iri na kore, amma ganyen BA ya curewa sosai kamar na Mosaic. Iccen zai yi kaman yana da lafiya, amma rogon ba zai yi yawa ba.\n\nABIN YI:\n1. Cirewa: Cire masu cutar nan da nan a kona su.\n2. Cire Ciyawa: Cire ciyawa a gona don rage yaduwar cutar.\n3. Tsaftace Kayan Aiki: Wanke kayan aiki (fartanya, adda) akai-akai.\n4. Zaɓen Iri: Yi amfani da irin da aka duba sosai cewa bashi da cuta.",
    ig: "NCHỌPỤTA (CGM):\nỌ na-eme ka akwụkwọ akpụ nwee ntụpọ na-acha akwụkwọ ndụ, mana ọ NAGHỊ akpụkọta nke ukwuu ka nke Mosaic. Osisi nwere ike iyi ka ọ dị mma, mana ọ gaghị amị ji nke ọma.\n\nIHE Ị GA-EME:\n1. Wepụ: Wepụ ma gbuo osisi ndị metụtara ozugbo ị hụrụ ha.\n2. Sụọ Ahịhịa: Sụọ ahịhịa oge niile iji gbochie nje a.\n3. Ịdị Ọcha: Na-ehicha ngwa ọrụ ugbo gị (ọbịa, mma) oge niile.\n4. Nhọrọ Mkpụrụ: Họrọ naanị osisi ndị dị mma maka ịkụ."
  },
  'Cassava brown streak disease': {
    en: "DIAGNOSIS (CBSD):\nThis is a 'silent killer'. The leaves may only show slight yellowing along the veins, which is hard to see. However, the tubers will have dry, brown, corky rot inside. It destroys the food part of the cassava.\n\nMANAGEMENT PLAN:\n1. Check Roots: If you see yellow veins on lower leaves, dig up one tuber to check for brown rot.\n2. Early Harvest: Harvest your cassava early (at 7-9 months). If you leave it longer, the rot becomes worse.\n3. Destroy Infected: If the tubers are rotten, burn the stems. Do not give them to neighbors or use them for planting.\n4. Clean Seeds: This is very important. Use only certified disease-free stakes from a trusted source.",
    yo: "AYEWO (CBSD):\nArun yii lewu pupo. O le nira lati ri lara ewe (isan ewe a pon die). Sugbon o ma n baje isu lati inu; isu a ni awo pupa ninu, a si le koko bi igi.\n\nOHUN TI E LE SE:\n1. Ayewo Isu: E ye isu wo ti e ba ri ami lara ewe; e sun un ti o ba ti baje.\n2. Ikore Kutukutu: E tete wa isu naa ki o to pon tan (osu 7-9). Ti o ba pe nile, yio baje si.\n3. Idena: E sun igi ti isu re ti baje. E ma fi fun elomiran.\n4. Igi Gbingbin: E ri pe e gba igi lati ibi ti arun yii ko si rara.",
    ha: "BINCIKE (CBSD):\nWannan cutar hatsari ce sosai. Ba a cika gane ta a ganye ba (sai dai jijiyar ganye ta yi rawaya). Amma tana lalata rogo daga ciki (ya yi kalon kasa-kasa ya rube, ya yi tauri).\n\nABIN YI:\n1. Duba Rogo: Duba rogon idan an ga alama a ganye; kone idan ya rube.\n2. Girbi da wuri: Yi girbi da wuri (wata 7-9) don a samu na ci kafin duka ya rube.\n3. Kariya: Kada a yi amfani da iccen rogo mai rubabben saiwa. Kone su.\n4. Iri Mai Tsabta: Yi amfani da iri da aka tabbatar bashi da cuta daga hukuma.",
    ig: "NCHỌPỤTA (CBSD):\nNke a dị ize ndụ. O siri ike ịhụ na akwụkwọ (akwara akwụkwọ na-acha odo odo), mana ọ na-emebi ji akpụ nke ukwuu (ọ na-acha nchara nchara n'ime ma sie ike).\n\nIHE Ị GA-EME:\n1. Nlele Ji: Gwuo otu ji lelee ma ọ bụrụ na ị hụ akara na akwụkwọ.\n2. Gwuo Ọsọ Ọsọ: Gwuo ji gị tupu oge eruo (ọnwa 7-9) ka ị nwee ike ịzọpụta ụfọdụ.\n3. Mkpụrụ Dị Ọcha: Kpọọ osisi nwere ji rere ere ọkụ. Ejila ya akụ ihe.\n4. Mgbochi: Jiri naanị mkpụrụ akwadoro na ọ nweghị nje a kụọ ihe."
  }
};


// --- Type Definitions ---
type Prediction = {
  className: string;
  probability: number;
};
type AppState = 'loading' | 'main' | 'camera' | 'result';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

interface ResultBarProps {
  label: string;
  probability: number;
}

// --- Helper Components ---

// Updated Button to make children optional and strictly typed
const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '' }) => {
  const baseClasses = 'w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold transition-transform duration-200 ease-in-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';
  const variantClasses = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus-visible:ring-gray-500',
    ghost: 'bg-transparent text-emerald-400 hover:bg-emerald-900/50 focus-visible:ring-emerald-500',
  };
  return <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

// Ensure ResultBar is defined outside App
const ResultBar: React.FC<ResultBarProps> = ({ label, probability }) => {
  const percentage = Math.round(probability * 100);
  const isHealthy = label.toLowerCase().includes('healthy');
  const isTop = probability > 0.5;

  let barColor = 'bg-gray-500';
  if(isHealthy) barColor = 'bg-green-500';
  else if (isTop) barColor = 'bg-orange-500';
  else barColor = 'bg-yellow-600';

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium truncate capitalize max-w-[70%]">{label}</span>
        <span className="text-sm font-bold text-gray-300">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// --- Main Application ---
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [model, setModel] = useState<LayersModel | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadModel = useCallback(async () => {
    try {
      setError(null);
      setAppState('loading');
      console.log('Attempting to load model...');
      
      // 1. Load labels from metadata
      // We fetch explicitly to catch 404s better for the user
      const metadataReq = await fetch(METADATA_URL);
      if (!metadataReq.ok) {
        throw new Error(`Failed to load metadata (Status: ${metadataReq.status}). Is the file in the 'public' folder?`);
      }
      const metadata = await metadataReq.json();
      
      // Format labels: Replace underscores with spaces
      const loadedLabels = metadata.labels.map((l: string) => l.replace(/_+/g, ' ').trim());
      setLabels(loadedLabels);

      // 2. Load the model (LayersModel for Keras/Teachable Machine)
      const model = await loadLayersModel(MODEL_URL);
      
      setModel(model);
      setAppState('main');
      console.log('Model loaded successfully.');
    } catch (err: any) {
      console.error('Model loading failed:', err);
      let errorMessage = 'Failed to load the model.';
      
      if (err.message && err.message.includes('weights')) {
         errorMessage = 'Failed to load model weights. Please ensure weights.bin is in the "public" folder.';
      } else if (err.message && err.message.includes('404')) {
         errorMessage = 'Model files not found (404). Please ensure model.json is in the "public" folder.';
      } else {
         errorMessage = `Error: ${err.message || 'Unknown error'}. Ensure files are in "public".`;
      }
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    ready().then(loadModel);
  }, [loadModel]);

  const startCamera = async () => {
    try {
      setError(null);
      let stream: MediaStream | null = null;
  
      // Attempt 1: Ideal constraints (back camera, HD)
      try {
        console.log('Attempting to start camera with ideal constraints...');
        const idealConstraints = {
          video: {
            facingMode: { ideal: 'environment' }, // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      } catch (err: any) {
        console.warn('Ideal constraints failed, trying fallback:', err.name);
        // If ideal fails (e.g., OverconstrainedError), try generic constraints
        if (['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(err.name)) {
          console.log('Falling back to generic camera constraints...');
          const fallbackConstraints = { video: true };
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        } else {
          // Re-throw other errors like NotAllowedError to be caught by the outer catch
          throw err;
        }
      }
  
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setAppState('camera');
      } else {
        throw new Error("Could not acquire a camera stream after fallback.");
      }
  
    } catch (err: any) {
      console.error('Camera access failed:', err.name, err.message);
      let errorMessage = 'Could not start the camera.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access was denied. Please enable camera permissions in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device. Please use the "Upload Image" option instead.';
      } else if (err.name === 'NotReadableError') {
         errorMessage = 'The camera is currently in use by another app or browser tab. Please close other applications using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
         errorMessage = 'The camera on this device is not supported by the browser, even with fallback settings.';
      }
      setError(errorMessage);
      setAppState('main');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        setAppState('result');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
        setAppState('result');
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setImage(null);
    setPredictions([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAppState('main');
  };

  const classifyImage = useCallback(async () => {
    if (!model || !image || labels.length === 0) return;

    const img = new Image();
    img.src = image;
    img.onload = async () => {
      try {
        // Teachable Machine (MobileNet) specific normalization:
        // Resize to 224x224 -> Float32 -> div(127.5) -> sub(1) to get range [-1, 1]
        const tensor = browser.fromPixels(img)
          .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE])
          .toFloat()
          .div(scalar(127.5))
          .sub(scalar(1))
          .expandDims();

        const predictionsTensor = model.predict(tensor) as Tensor;
        const predictionsArray = await predictionsTensor.data() as Float32Array;

        const results: Prediction[] = Array.from(predictionsArray)
          .map((probability, i) => ({
            className: labels[i] || `Class ${i + 1}`,
            probability,
          }))
          .sort((a, b) => b.probability - a.probability);

        setPredictions(results);
        dispose([tensor, predictionsTensor]);
      } catch (err) {
        console.error('Prediction failed:', err);
        setError('An error occurred during classification.');
      }
    };
  }, [model, image, labels]);

  useEffect(() => {
    if (appState === 'result' && image) {
      classifyImage();
    }
  }, [appState, image, classifyImage]);

  // --- Render Logic ---
  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center text-center text-white h-full p-6">
      <Leaf className="w-20 h-20 text-emerald-400 mb-6 animate-pulse-icon" />
      <h1 className="text-3xl font-bold mb-2">Cassava Doctor</h1>
      <p className="text-lg text-gray-300">Loading AI Model...</p>
      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-3 text-left max-w-md">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <p className="font-bold">Loading Error</p>
            <p className="text-sm">{error}</p>
            <button onClick={loadModel} className="mt-2 text-sm underline font-bold hover:text-white">Try again</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderMainScreen = () => (
    <div className="bg-gray-900 text-white h-full flex flex-col p-6">
      <header className="text-center mb-8 flex flex-col items-center">
        {/* App Logo */}
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/30">
           <Leaf className="w-14 h-14 text-emerald-500" fill="currentColor" fillOpacity={0.2} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Cassava Doctor</h1>
        <p className="text-lg text-gray-400 mt-2">Identify leaf diseases with a snapshot.</p>
      </header>
      <main className="flex-grow flex flex-col justify-center items-center gap-6">
        <Button onClick={startCamera} className="animate-pulse-camera">
          <Camera size={24} />
          <span>Use Camera</span>
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
          <Upload size={24} />
          <span>Upload Image</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
         {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg text-sm text-center max-w-md">
              <p className="font-bold">Camera Error</p>
              <p>{error}</p>
            </div>
          )}
      </main>
      <footer className="text-center text-gray-500 text-sm mt-8">
        <p>This tool provides a preliminary diagnosis. Always consult with a qualified agricultural expert for confirmation.</p>
      </footer>
    </div>
  );

  const renderCameraScreen = () => (
    <div className="relative h-full w-full bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" playsInline />
      <div className="absolute top-4 left-4">
        <button
          onClick={() => { stopCamera(); setAppState('main'); }}
          className="bg-black/50 text-white rounded-full p-3 transition-colors hover:bg-black/75"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={captureImage}
          className="w-20 h-20 rounded-full bg-white ring-4 ring-white/30 transition-transform active:scale-95"
          aria-label="Capture image"
        />
      </div>
    </div>
  );

  const renderResultScreen = () => {
    const topPrediction = predictions[0];
    const isHealthy = topPrediction?.className.toLowerCase().includes('healthy');
    
    let statusIcon: React.ReactNode;
    let statusColor: string;
    let statusText: string;

    if (!topPrediction) {
      statusIcon = <Leaf className="w-8 h-8 text-gray-400 animate-pulse-icon" />;
      statusColor = 'text-gray-300';
      statusText = 'Analyzing...';
    } else if (isHealthy) {
      statusIcon = <CheckCircle className="w-8 h-8 text-green-400" />;
      statusColor = 'text-green-400';
      statusText = 'Healthy';
    } else {
      statusIcon = <AlertTriangle className="w-8 h-8 text-orange-400" />;
      statusColor = 'text-orange-400';
      statusText = 'Disease Detected';
    }

    const explanation = topPrediction && DISEASE_INFO[topPrediction.className] 
      ? DISEASE_INFO[topPrediction.className][selectedLanguage] 
      : "No specific advice available for this result.";

    return (
      <div className="bg-gray-900 text-white h-full flex flex-col overflow-y-auto">
        <div className="relative h-[40vh] flex-shrink-0">
          {image && <img src={image} alt="Cassava leaf" className="w-full h-full object-cover" />}
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          <button onClick={reset} className="absolute top-4 left-4 bg-gray-800/60 rounded-full p-2 hover:bg-gray-700 transition" aria-label="Go back">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow flex flex-col p-6 -mt-12 bg-gray-900 rounded-t-3xl animate-slide-up shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-10">
          <div className="flex items-center gap-4 mb-6">
             {statusIcon}
             <div>
                <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
                {topPrediction && <p className="text-gray-400 text-sm capitalize">{topPrediction.className}</p>}
             </div>
          </div>

           {/* Explanation Section */}
           {topPrediction && (
            <div className="mb-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase tracking-wide">Diagnosis & Advice</span>
                </div>
                {/* Language Switcher */}
                <div className="flex bg-gray-700 rounded-lg p-1 flex-wrap">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition-colors ${selectedLanguage === lang.id ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>
          )}
          
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detailed Analysis</h3>
            {predictions.length > 0 ? (
                predictions.map(p => <ResultBar key={p.className} label={p.className} probability={p.probability}/>)
            ) : (
                Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 w-full animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-2/5"></div>
                      <div className="h-2.5 bg-gray-700 rounded-full w-3/5"></div>
                    </div>
                ))
            )}
          </div>
          
          {error && (
            <div className="my-4 bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-auto">
            <Button onClick={reset} variant="secondary">
              <RefreshCw size={20} />
              <span>Analyze Another</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full w-full bg-gray-900 overflow-hidden relative">
      <div className={`page ${appState === 'loading' ? 'active' : ''}`}>{renderLoadingScreen()}</div>
      <div className={`page ${appState === 'main' ? 'active' : ''}`}>{renderMainScreen()}</div>
      <div className={`page ${appState === 'camera' ? 'active' : ''}`}>{renderCameraScreen()}</div>
      <div className={`page ${appState === 'result' ? 'active' : ''}`}>{renderResultScreen()}</div>
    </div>
  );
};

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
createRoot(container).render(<App />);
