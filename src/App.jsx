import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { mirage } from "ldrs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDeleteLeft, faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faPlay } from "@fortawesome/free-solid-svg-icons/faPlay";
import { faPause } from "@fortawesome/free-solid-svg-icons/faPause";
const genAI = new GoogleGenerativeAI("AIzaSyDDm8eRTp0t3uO8F-GuSE_wIFhQZS_1CAQ");

function App() {
  const commands = [
    "open youtube",
    "open instagram",
    "open github",
    "open linkedin",
  ];
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
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const msg = prompt;

    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();

    const processedResponse = text.replace(/<[^>]*>/g, " ").replace(/\./g, ",");

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
      if (transcript.startsWith("open")) {
        openInNewTab(`https://www.${transcript.split(" ")[1]}.com`);
      }
    };
  }

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
  function openInNewTab(url) {
    window.open(url, "_blank");
  }

  return (
    <>
      <Navbar />

      <h1 className="text-[30px] mt-[20px] m-[20px] font-bold text-[white] block ">
        Your Friendly Neighbourhood AI Assistant
      </h1>
      <div className="h-[300px] w-[full] bg-[#00224D] ml-[20px] mt-[60px] flex ">
        <div className="h-full w-[50px] mt-[15px] ml-[10px] mr-[-40px] flex-shrink-0">
          <img
            src="https://static01.nyt.com/images/2021/04/30/multimedia/30xp-meme/29xp-meme-mediumSquareAt3X-v5.jpg"
            alt="user"
            className="rounded-full text-white "
          />
        </div>
        <pre className="custom-scrollbar overflow-y-scroll overflow-x-hidden text-white text-[30px] text-left p-[20px] flex-grow whitespace-pre-wrap">
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
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              generateresponse();
            }
          }}
          type="text"
        />
        <br></br>
        <button
          className="block-inline float-right ml-[20px]"
          onClick={() => {
            setanswer("");
          }}
        >
          <FontAwesomeIcon icon={faDeleteLeft} />
          &nbsp; clear&nbsp;&nbsp;
        </button>
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
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          className=" float-right ml-[20px] mr-[20px]"
          onClick={() => {
            if (prompt.startsWith("open")) {
              openInNewTab(`https://www.${prompt.split(" ")[1]}.com`);
            } else {
              generateresponse();
            }
          }}
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
