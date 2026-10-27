function rate(v) {
  if (v == null || Number.isNaN(Number(v))) return "–";
  return `${(Number(v) * 100).toFixed(1)}%`;
}

function countLabel(n) {
  const value = Number(n);
  return Number.isInteger(value) ? String(value) : String(value);
}

function modelTip(b) {
  const mark = b.few ? " Short sample." : "";
  return `${b.bin}. Model probability ${rate(b.pred)}. Hit rate ${rate(b.obs)}. ${countLabel(b.n)} picks.${mark}`;
}

function marketTip(b) {
  return `${b.bin}. Where the market priced these same picks: ${rate(b.market)}. Same hit rate ${rate(b.obs)}, ${countLabel(b.n)} picks.`;
}

export default function CalChart({ buckets, shortSample, league }) {
  if (!buckets?.length) return null;
  const hasMarket = buckets.some((b) => b.market != null);
  const hasFew = buckets.some((b) => b.few);
  const described = `${league ? `${league}. ` : ""}Calibration. ${buckets.map((b) => {
    const market = b.market != null ? ` Where the market priced these same picks: ${rate(b.market)}.` : "";
    return `${modelTip(b)}${market}`;
  }).join(" ")}`;
  const ys = [100, 75, 50, 25, 0];
  return (
    <div className="calblock">
      {league && <h3 className="side-h">{league}</h3>}
      <div className="cal-frame">
        <span className="cal-axis-name y">Hit rate</span>
        <div className="calplot">
          <div className="cal-area" role="img" aria-label={described}>
            <div className="cal-ylabels" aria-hidden="true">
              {ys.map((n) => <span key={n}>{n}%</span>)}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {ys.map((n) => (
                <line key={n} x1="0" x2="100" y1={100 - n} y2={100 - n} stroke="var(--grid)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              ))}
              <line x1="0" y1="100" x2="100" y2="0" stroke="var(--bronze)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
            </svg>
            {buckets.map((b) => (
              <span
                key={`m-${b.bin}`}
                className={"caldot model" + (b.few ? " few" : "")}
                style={{ left: `${b.pred * 100}%`, bottom: `${b.obs * 100}%` }}
                title={modelTip(b)}
              >
                <span className={"cal-n" + (b.pred > 0.82 ? " left" : "")}>{countLabel(b.n)}</span>
              </span>
            ))}
            {buckets.filter((b) => b.market != null).map((b) => (
              <span
                key={`k-${b.bin}`}
                className={"caldot book" + (b.few ? " few" : "")}
                style={{ left: `${b.market * 100}%`, bottom: `${b.obs * 100}%` }}
                title={marketTip(b)}
              />
            ))}
          </div>
          <div className="cal-xlabels" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
          <span className="cal-axis-name x">Probability</span>
        </div>
      </div>
      <ul className="cal-legend">
        <li><i className="swatch model" aria-hidden="true" /> Model</li>
        {hasMarket && <li><i className="swatch book" aria-hidden="true" /> Where the market priced these same picks</li>}
        <li><i className="swatch line" aria-hidden="true" /> Hit rate equals the probability</li>
        {hasFew && <li><i className="swatch few" aria-hidden="true" /> Short sample, under {shortSample}</li>}
      </ul>
      <div className="tablewrap">
        <table className="stack">
          <caption>Model probability in each bucket, and how often those picks won. The market price is where the market priced these same picks. Same picks, same results. The count is the number of picks in the bucket.</caption>
          <thead>
            <tr>
              <th scope="col">Bucket</th>
              <th scope="col" className="r">Model probability</th>
              <th scope="col" className="r">Hit rate</th>
              <th scope="col" className="r">Picks</th>
              {hasMarket && <th scope="col" className="r">Market price</th>}
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
                {hasMarket && <td className="r num" data-label="Market price">{b.market != null ? rate(b.market) : "–"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
