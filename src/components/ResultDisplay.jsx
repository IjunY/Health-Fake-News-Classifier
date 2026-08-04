export default function ResultDisplay({ result, onTriggerParent }) {
  if (!result) return null;

  const goToMain = () => {
    onTriggerParent();
  };

  // The API sends the key sentences in one field and the headline in another.
  // Pick them by shape so the display survives either field order.
  const sentences = Array.isArray(result.sentences)
    ? result.sentences
    : Array.isArray(result.title)
    ? result.title
    : [];
  const rawTitle =
    typeof result.title === "string"
      ? result.title
      : typeof result.sentences === "string"
      ? result.sentences
      : "";
  const articleTitle = rawTitle.trim() || "（此來源未提供標題）";

  // Split the raw article body into clean paragraphs for readable formatting
  const paragraphs = String(result.text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const isReal = result.prediction === 0;
  // The API sends a pre-formatted percentage ("87%"); fall back to a raw
  // 0-1 ratio so the bar still renders if that ever changes.
  const rawProbability = String(result.probability ?? "");
  const numericProbability = parseFloat(rawProbability);
  const score = Number.isFinite(numericProbability)
    ? Math.min(
        Math.max(
          rawProbability.includes("%") || numericProbability > 1
            ? numericProbability
            : numericProbability * 100,
          0
        ),
        100
      )
    : null;
  const probabilityText = score === null ? rawProbability : `${Math.round(score)}%`;
  const confidenceLabel =
    score === null ? "可能" : score > 85 ? "極有可能" : score > 65 ? "很有可能" : "可能";
  const verdictZh = isReal ? "真實新聞" : "假新聞";
  const verdictEn = isReal
    ? confidenceLabel === "極有可能"
      ? "This news is true"
      : confidenceLabel === "很有可能"
      ? "This news is likely true"
      : "This news is probably true"
    : confidenceLabel === "極有可能"
    ? "This news is false"
    : confidenceLabel === "很有可能"
    ? "This news is likely false"
    : "This news is probably false";

  return (
    <section
      id="result-wrapper"
      className="flex column align-start"
      aria-live="polite"
    >
      <div className="result-header flex column align-start">
        <h2 className="bold">分析結果</h2>
        <p className="subtle-text">經過您選擇的模型分析，這篇文章...</p>
      </div>

      <div
        id="result-display"
        className="flex column light-green-background w100percent"
      >
        <div id="main-result-display" className="flex row align-center">
          {isReal ? (
            <img
              className="icon"
              src="/images/green-check.svg"
              alt=""
              aria-hidden="true"
            />
          ) : (
            <span className="icon icon-false" aria-hidden="true" />
          )}
          <div id="result-label">
            <h3 className="bold f3rem">
              {confidenceLabel}是
              <span className={`bold f3rem ${isReal ? "dark-green-text" : "error"}`}>
                {verdictZh}
              </span>
            </h3>
            <p className="bold f1-5rem subtle-text">{verdictEn}</p>
          </div>
        </div>

        <div className="confidence-block">
          <div className="confidence-head flex row">
            <h3 className="f1-5rem bold">可信度</h3>
            <span className="confidence-value bold f1-5rem">
              {probabilityText}
            </span>
          </div>
          {score !== null && (
            <div
              className="confidence-bar"
              role="img"
              aria-label={`可信度 ${probabilityText}`}
              title={`可信度 ${probabilityText}`}
            >
              <span
                className={`confidence-fill ${isReal ? "" : "confidence-fill-false"}`}
                style={{ width: `${score}%` }}
              />
            </div>
          )}
        </div>

        <div className="info-result-display">
          <h3 className="f1-5rem bold">關鍵句</h3>
          <p className="subtle-text">最影響本次判斷的三個句子</p>
          <ol className="sentence-list">
            {sentences.map((item, index) => (
              <li key={index} className="sentence-card">
                <span className="sentence-index" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="sentence-text">{item}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="article-block">
          <h3 className="f1-5rem bold" id="article-block-heading">
            原文內容
          </h3>
          <div
            className="article-scroll"
            tabIndex={0}
            role="region"
            aria-labelledby="article-block-heading"
          >
            <h4 className="article-title bold">{articleTitle}</h4>
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="article-paragraph">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="article-paragraph subtle-text">（沒有可顯示的內文）</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={goToMain}
        className="bold f1-5rem analyze-button"
      >
        再分析一篇
      </button>
    </section>
  );
}
