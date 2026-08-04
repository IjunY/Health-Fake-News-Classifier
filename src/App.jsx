import { useState } from "react";
import ResultDisplay from "./components/ResultDisplay";

export default function App() {
  const [url, setUrl] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState("");

  const handleSubmit = async () => {
    setManualMode(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:5500/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          manualContent: manualInput,
          model: model,
        }),
      });

      const data = await response.json();

      if (!response.ok && data.error.includes("manually enter")) {
        setManualMode(true);
        setError("錯誤：無法自動擷取該網址內容，請自行輸入文章內文");
        setLoading(false);
      } else {
        setResult(data);
        setManualInput("");
        setManualMode(false);
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred at the server.");
      setLoading(false);
    }
  };

  const goToMain = () => {
    setUrl("");
    setManualInput("");
    setManualMode(false);
    setResult(null);
    setLoading(false);
    setError(null);
    setModel("");
  };

  return (
    <main>
      <header id="header" className="flex column align-center">
        <h1 className="bold f3-5rem">健康醫療類假新聞辨別平台</h1>
        <p className="bold f3rem">Health Misinformation Detector</p>
      </header>

      <div id="url-input-div" className="flex column">
        <label
          htmlFor="url-input-field"
          className="green-text f1-5rem block-label"
        >
          請在下方輸入新聞網址
        </label>
        <div id="url-input-row" className="flex row align-start w100percent">
          <input
            type="text"
            id="url-input-field"
            className="input-field f1-5rem"
            placeholder="https://example.com/news-article"
            value={url}
            disabled={loading}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="analyze-button f1-5rem bold"
            id="url-submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            <img src="/images/white-analyze.svg" alt="" />
            分析文章
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex column url-error-div"
          role="alert"
          aria-live="assertive"
        >
          <p className="error f1-5rem">{error}</p>
          <div id="manual-input-row" className="flex column w100percent">
            <label htmlFor="manual-input-field" className="visually-hidden">
              請輸入文章內文
            </label>
            <textarea
              id="manual-input-field"
              placeholder="請輸入文章內文"
              value={manualInput}
              disabled={loading}
              onChange={(e) => setManualInput(e.target.value)}
              className="input-field"
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="f1-5rem bold analyze-button"
              disabled={loading}
            >
              <img src="/images/white-analyze.svg" alt="" />
              分析文章
            </button>
          </div>
        </div>
      )}

      <fieldset id="model-selection" className="flex row align-center">
        <legend className="f1-5rem medium">選取模型</legend>
        <span className="model-choice-option">
          <input
            type="radio"
            id="model-traditional"
            className="model-choice medium"
            name="model"
            checked={model === "traditional"}
            onChange={() => setModel("traditional")}
          />
          <label htmlFor="model-traditional">邏輯回歸（預設）</label>
        </span>
        <span className="model-choice-option">
          <input
            type="radio"
            id="model-deep-learning"
            className="model-choice medium"
            name="model"
            checked={model === "deep_leaning"}
            onChange={() => setModel("deep_leaning")}
          />
          <label htmlFor="model-deep-learning">深度學習</label>
        </span>
      </fieldset>

      <p aria-live="polite">{loading && "載入中..."}</p>
      <br />
      {result !== null && (
        <ResultDisplay result={result} onTriggerParent={goToMain}></ResultDisplay>
      )}
    </main>
  );
}
