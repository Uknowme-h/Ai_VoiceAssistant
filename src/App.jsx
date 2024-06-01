import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { mirage } from "ldrs";

function App() {
  const [prompt, setprompt] = useState("");
  const [answer, setanswer] = useState("");
  const [loader, setloader] = useState("hidden");
  const [isspeaking, setspeaking] = useState(true);
  async function generateresponse() {
    setprompt("");
    setanswer("");
    setloader("visible");
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDDm8eRTp0t3uO8F-GuSE_wIFhQZS_1CAQ",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    const geminiresponse = data["candidates"][0]["content"]["parts"][0]["text"];

    const processedResponse = geminiresponse.replace(/<[^>]*>/g, "");
    processedResponse.replace(/./g, ",");

    query({ inputs: processedResponse })
      .then((audio) => {
        setloader("hidden");
        if (isspeaking) {
          audio.play();
        } else {
          audio.pause();
        }

        setanswer(geminiresponse);
      })
      .catch((error) => {
        console.error("Error playing audio", error);
      });
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.start();

    recognition.onresult = function (event) {
      const current = event.resultIndex;

      const transcript = event.results[current][0].transcript;
      setprompt(transcript);
    };
  }

  function speakResponse(word) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(word);
    synth.speak(utterance);
  }

  // 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
  async function query(data) {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech",
      {
        headers: {
          Authorization: "Bearer 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",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const result = await response.blob();
    const audioUrl = URL.createObjectURL(result);
    const audio = new Audio(audioUrl);
    return audio;
  }

  return (
    <>
      <Navbar />

      <h1 className="text-[30px] mt-[20px] m-[20px] font-bold block">
        AI Voice Assistant ChatBot
      </h1>
      <div className="h-[300px] w-[full] bg-primary ml-[20px] mt-[60px]">
        <pre className="h-full w-full overflow-y-scroll text-white text-[30px] text-left p-[20px]">
          {answer}
        </pre>

        <div className={`absolute top-[40%] right-[43%] text-white ${loader}`}>
          {mirage.register()}
          <l-mirage size="200" speed="2.5" color="white"></l-mirage>
        </div>
      </div>

      <div className="m-[20px]">
        <input
          className="m-[5px] mb-[20px] p-[10px] w-[99%] border-2 border-primary "
          value={prompt}
          onChange={(e) => setprompt(e.target.value)}
          type="text"
        />
        <br></br>
        <button
          className="block-inline float-right"
          onClick={() => setspeaking(false)}
        >
          Pause
        </button>
        <button
          className=" float-right ml-[20px] mr-[20px]"
          onClick={generateresponse}
        >
          Send
        </button>

        <button className="block-inline float-right" onClick={startListening}>
          Start Listening
        </button>
      </div>
    </>
  );
}

export default App;
