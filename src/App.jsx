import { useCallback, useState } from "react";
import ResultDisplay from "./components/ResultDisplay";
import ErrorModal from "./components/ErrorModal";

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

      if (!response.ok) {
        const message = data.error || "";
        if (message.includes("model selection error")) {
          setError("模型發生異常，請稍候");
        } else if (message.includes("download failure")) {
          setManualMode(true);
          setError("無法自動擷取該網址內容，請自行輸入文章內文");
        } else if (message.includes("Internet connection")) {
          setError("請檢查網路連線後再重新試一次");
        } else if (message.includes("invalid url")) {
          setManualMode(true);
          setError("請再次確認您提供的連結是否正確，或手動輸入文章內容");
        } else if (message.includes("can't process article text")) {
          setError("很抱歉，文章內容無法被處理");
        } else {
          setError("發生未知錯誤，請稍候再試");
        }
        setLoading(false);
      } else {
        setResult(data);
        setManualInput("");
        setManualMode(false);
        setLoading(false);
      }
    } catch {
      setError("伺服器連線發生問題，請稍候再試");
      setLoading(false);
    }
  };

  // Dismiss the popup but keep the manual-input area open when the error
  // is one the user can recover from by pasting the article themselves.
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

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
        <span className="eyebrow">AI 健康新聞檢測</span>
        <h1 className="bold f3-5rem">健康醫療類假新聞辨別平台</h1>
        <p className="subtitle f1-5rem">Health Misinformation Detector</p>
      </header>

      <section className="panel" aria-labelledby="analyze-heading">
        <h2 id="analyze-heading" className="visually-hidden">
          分析文章
        </h2>

        <div id="url-input-div" className="flex column">
          <label
            htmlFor="url-input-field"
            className="dark-green-text f1-5rem bold block-label"
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

        {manualMode && (
          <div id="manual-input-row" className="flex column w100percent">
            <label
              htmlFor="manual-input-field"
              className="dark-green-text f1-5rem bold block-label"
            >
              或直接貼上文章內文
            </label>
            <textarea
              id="manual-input-field"
              placeholder="請輸入文章內文"
              value={manualInput}
              disabled={loading}
              onChange={(e) => setManualInput(e.target.value)}
              className="input-field textarea-field"
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
        )}

        <fieldset id="model-selection">
          <legend className="f1-5rem bold dark-green-text">選取模型</legend>
          <div className="model-choice-list flex row">
            <span className="model-choice-option">
              <input
                type="radio"
                id="model-traditional"
                className="model-choice"
                name="model"
                checked={model === "traditional"}
                disabled={loading}
                onChange={() => setModel("traditional")}
              />
              <label htmlFor="model-traditional">邏輯回歸（預設）</label>
            </span>
            <span className="model-choice-option">
              <input
                type="radio"
                id="model-deep-learning"
                className="model-choice"
                name="model"
                checked={model === "deep_leaning"}
                disabled={loading}
                onChange={() => setModel("deep_leaning")}
              />
              <label htmlFor="model-deep-learning">深度學習</label>
            </span>
          </div>
        </fieldset>
      </section>

      <p className="loading-row" aria-live="polite">
        {loading && (
          <>
            <span className="spinner" aria-hidden="true" />
            分析中，請稍候...
          </>
        )}
      </p>

      {result !== null && (
        <ResultDisplay result={result} onTriggerParent={goToMain}></ResultDisplay>
      )}

      <ErrorModal message={error} onClose={dismissError} />
    </main>
  );
}
