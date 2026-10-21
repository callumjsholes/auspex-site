export default function NotFound() {
  return (
    <div className="page wrap">
      <h1>That page isn't here.</h1>
      <p className="lede">Today's picks and the full record are one click away.</p>
      <div className="ctas" style={{ marginTop: 24 }}>
        <a className="btn line" href="/#today">Today's picks</a>
        <a className="btn line" href="/record">The record</a>
      </div>
    </div>
  );
}
