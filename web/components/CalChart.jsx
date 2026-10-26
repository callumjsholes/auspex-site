function rate(v) {
  if (v == null || Number.isNaN(Number(v))) return "–";
  return `${(Number(v) * 100).toFixed(1)}%`;
}

function countLabel(n) {
  const value = Number(n);
  const text = Number.isInteger(value) ? String(value) : String(value);
  return text;
}

export default function CalChart({ buckets, shortSample, present }) {
  const hasBook = buckets.some((b) => b.book);
  const described = buckets.length
    ? `Calibration chart. ${buckets.map((b) => `${b.bin}: average probability ${rate(b.pred)}, hit rate ${rate(b.obs)}, ${countLabel(b.n)} picks${b.few ? ", short sample" : ""}`).join(". ")}.`
    : "Calibration chart. No buckets in this publish. Nothing is plotted.";
  const ys = [100, 75, 50, 25, 0];
  return (
    <div className="calblock">
      <div className="cal-frame">
        <span className="cal-axis-name y">Hit rate</span>
        <div className="calplot">
          <div className="cal-area" role="img" aria-label={described}>
            <div className="cal-ylabels" aria-hidden="true">
              {ys.map((n) => <span key={n}>{n}%</span>)}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {ys.map((n) => (
                <line key={n} x1="0" x2="100" y1={100 - n} y2={100 - n} stroke="var(--line)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              ))}
              <line x1="0" y1="100" x2="100" y2="0" stroke="var(--bronze)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
            </svg>
            {buckets.map((b) => (
              <span
                key={`m-${b.bin}`}
                className={"caldot model" + (b.few ? " few" : "")}
                style={{ left: `${b.pred * 100}%`, bottom: `${b.obs * 100}%` }}
              />
            ))}
            {buckets.filter((b) => b.book).map((b) => (
              <span
                key={`b-${b.bin}`}
                className={"caldot book" + (b.book.few ? " few" : "")}
                style={{ left: `${b.book.pred * 100}%`, bottom: `${b.book.obs * 100}%` }}
              />
            ))}
            {!buckets.length && <p className="cal-empty">{present ? "The list in this publish is empty." : "No buckets in this publish."}</p>}
          </div>
          <div className="cal-xlabels" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
          <span className="cal-axis-name x">Bucket probability</span>
        </div>
      </div>
      <ul className="cal-legend">
        <li><i className="swatch model" aria-hidden="true" /> Model</li>
        {hasBook && <li><i className="swatch book" aria-hidden="true" /> Books</li>}
        <li><i className="swatch line" aria-hidden="true" /> Hit rate equals the bucket</li>
        <li><i className="swatch few" aria-hidden="true" /> Short sample, under {shortSample}</li>
      </ul>
      {buckets.length > 0 && (
        <div className="tablewrap">
          <table className="stack">
            <caption>Model probability buckets and how often those picks won. The count is the number of picks in the bucket.</caption>
            <thead>
              <tr>
                <th scope="col">Bucket</th>
                <th scope="col" className="r">Model probability</th>
                <th scope="col" className="r">Hit rate</th>
                <th scope="col" className="r">Picks</th>
                {hasBook && <th scope="col" className="r">Book probability</th>}
                {hasBook && <th scope="col" className="r">Book hit rate</th>}
                {hasBook && <th scope="col" className="r">Book picks</th>}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.bin}>
                  <th scope="row" data-label="Bucket">
                    <span className="split-name">{b.bin}</span>
                    {b.few && <span className="flag">Short sample</span>}
                  </th>
                  <td className="r num" data-label="Model probability">{rate(b.pred)}</td>
                  <td className="r num" data-label="Hit rate">{rate(b.obs)}</td>
                  <td className="r num" data-label="Picks">{countLabel(b.n)}</td>
                  {hasBook && <td className="r num" data-label="Book probability">{b.book ? rate(b.book.pred) : "–"}</td>}
                  {hasBook && <td className="r num" data-label="Book hit rate">{b.book ? rate(b.book.obs) : "–"}</td>}
                  {hasBook && (
                    <td className="r num" data-label="Book picks">
                      {b.book ? countLabel(b.book.n) : "–"}
                      {b.book?.few && <span className="flag">Short sample</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
