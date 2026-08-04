export default function ResultDisplay({ result, onTriggerParent }) {
  if (!result) return null;

  const goToMain = () => {
    onTriggerParent();
  };

  const isReal = result.prediction === 0;
  const confidenceLabel =
    result.probability > 0.85 ? "極有可能" : result.probability > 0.65 ? "很有可能" : "可能";
  const verdictZh = isReal ? "真實新聞" : "假新聞";
  const verdictEn = isReal
    ? result.probability > 0.85
      ? "This news is true"
      : result.probability > 0.65
      ? "This news is likely true"
      : "This news is probably true"
    : result.probability > 0.85
    ? "This news is false"
    : result.probability > 0.65
    ? "This news is likely false"
    : "This news is probably false";

  return (
    <section id="result-wrapper" className="flex column align-start" aria-live="polite">
      <div className="result-header flex column align-start">
        <h2>分析結果</h2>
        <p>經過您選擇的模型分析，這篇文章...</p>
      </div>

      <div
        id="result-display"
        className="flex column light-green-background w100percent"
      >
        <div id="main-result-display" className="flex row align-center">
          {isReal ? (
            <img className="icon" src="/images/green-check.svg" alt="" aria-hidden="true" />
          ) : (
            <span className="icon icon-false" aria-hidden="true" />
          )}
          <div id="result-label">
            <h3 className="bold f3rem">
              {confidenceLabel}是
              <span className="bold dark-green-text f3rem">{verdictZh}</span>
            </h3>
            <p className="bold f1-5rem">{verdictEn}</p>
          </div>
        </div>
        <div className="info-result-display">
          <div>
            <h3 className="f1-5rem">可信度：{result.probability}</h3>
          </div>
          <div>
            <h3 className="f1-5rem">關鍵句</h3>
            <ul>
              {result.sentences.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
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
