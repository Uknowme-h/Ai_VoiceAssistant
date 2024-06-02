import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { mirage } from "ldrs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faPlay } from "@fortawesome/free-solid-svg-icons/faPlay";
import { faPause } from "@fortawesome/free-solid-svg-icons/faPause";
const genAI = new GoogleGenerativeAI("AIzaSyDDm8eRTp0t3uO8F-GuSE_wIFhQZS_1CAQ");

function App() {
  const [prompt, setprompt] = useState("");
  const [answer, setanswer] = useState("what can I help you with today?");
  const [loader, setloader] = useState("hidden");
  const [isspeaking, setspeaking] = useState(true);
  const [audio, setAudio] = useState(null); // Add this line
  const [isPlaying, setisPlaying] = useState(false);

  const [chatHistory, setChatHistory] = useState([]); // Add this line

  async function generateresponse() {
    setanswer("");
    setloader("visible");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: chatHistory, // Use chatHistory here
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const msg = prompt;

    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();

    const processedResponse = text.replace(/<[^>]*>/g, " ").replace(/\./g, ",");

    // Update chatHistory with the new message and response
    setChatHistory([
      ...chatHistory,
      { role: "user", parts: [{ text: msg }] },
      { role: "model", parts: [{ text }] },
    ]);

    query({ inputs: processedResponse })
      .then((audio) => {
        setloader("hidden");
        setAudio(audio);
        if (isspeaking) {
          audio.play();
          setisPlaying(true);
        } else {
          audio.pause();
          setisPlaying(false);
        }

        setanswer(text);
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

  // function speakResponse(word) {
  //   const synth = window.speechSynthesis;
  //   const utterance = new SpeechSynthesisUtterance(word);
  //   synth.speak(utterance);
  // }

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

      <h1 className="text-[30px] mt-[20px] m-[20px] font-bold text-[white] block">
        Your Friendly Neighbourhood AI Assistant
      </h1>
      <div className="h-[300px] w-[full] bg-[#00224D] ml-[20px] mt-[60px]">
        <pre className="h-full w-full overflow-y-scroll text-white text-[30px] text-left p-[20px] mt-[50px] flex">
          <div className=" h-[50px] w-[50px]  flex">
            <img
              src="https://static01.nyt.com/images/2021/04/30/multimedia/30xp-meme/29xp-meme-mediumSquareAt3X-v5.jpg"
              alt="user"
              className="rounded-full text-white"
            />
          </div>
          &nbsp; &nbsp;
          {answer}
        </pre>

        <div className={`absolute top-[40%] right-[43%] text-white ${loader}`}>
          {mirage.register()}
          <l-mirage size="200" speed="2.5" color="white"></l-mirage>
        </div>
      </div>

      <div className="m-[20px]">
        <input
          className="m-[5px] mb-[20px] p-[10px] w-[99%] border-2 border-primary bg-[#00224D] text-white rounded-md"
          value={prompt}
          placeholder="Type your message here..."
          onChange={(e) => setprompt(e.target.value)}
          type="text"
        />
        <br></br>
        <button
          className="block-inline float-right"
          onClick={() => {
            setspeaking(!isspeaking);
            if (audio) {
              if (isPlaying) {
                audio.pause();
              } else {
                audio.play();
              }
              setisPlaying(!isPlaying);
            }
          }}
        >
          <FontAwesomeIcon icon={isPlaying ? faPlay : faPause} /> &nbsp;
          {isPlaying ? "Pause" : "Play"}{" "}
        </button>
        <button
          className=" float-right ml-[20px] mr-[20px]"
          onClick={generateresponse}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
          &nbsp; Send
        </button>

        <button className="block-inline float-right" onClick={startListening}>
          <FontAwesomeIcon icon={faMicrophone} /> &nbsp; Speak
        </button>
      </div>
    </>
  );
}

export default App;
