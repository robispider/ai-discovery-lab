/* The street illustration for lesson 8, drawn once and reused by both intersections.
   Generated from the legacy traffic page. The colours are part of the drawing, not UI tokens. */

export function SceneDefs() {
  return (
    <svg className="tr-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <g id="tr-city-tree">
          <circle cx="1.5" cy="2.5" r="6.5" fill="#667954" opacity=".25" />
          <circle r="6.5" fill="#63916b" />
          <circle cx="-1" cy="-1.5" r="5" fill="#80a477" />
          <path d="M-3-2q1-2 3-2" fill="none" stroke="#b7ca9d" strokeLinecap="round" />
        </g>
        <g id="tr-city-shrub">
          <circle r="3.4" fill="#83a179" />
          <circle cx="-1" cy="-1" r="2" fill="#a0b78a" />
        </g>
        <g id="tr-city-crosswalk" fill="#dadcce">
          <path d="M0 0h5v9H0zm8 0h5v9H8zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5zm8 0h5v9h-5z" />
        </g>
        <g id="tr-city-car">
          <rect
            x="-6.8"
            y="-11"
            width="14"
            height="24"
            rx="5"
            fill="#142327"
            opacity=".6"
            transform="translate(1 1)"
          />
          <path d="M-7-7h14m-14 13h14" stroke="#20282b" strokeWidth="2.8" />
          <rect
            x="-6.2"
            y="-11.4"
            width="12.4"
            height="22.8"
            rx="4"
            fill="currentColor"
            stroke="#28363b"
            strokeWidth=".8"
          />
          <path d="M-4.6-6.3q4.6-2 9.2 0l-.8 3.8h-7.6zm.8 9.1h7.6l.7 3.6q-4.5 1.4-9 0z" fill="#28404b" />
          <path d="M-2.7-5.7h3.5" stroke="#bce0ea" opacity=".7" strokeLinecap="round" />
          <path d="M-4.3-9.2h1.9m4.8 0h1.9" stroke="#fcf3cf" strokeLinecap="round" strokeWidth="1.25" />
          <path d="M-4.1 9h1.4m5.4 0h1.4" stroke="#c34748" strokeLinecap="round" strokeWidth="1.2" />
        </g>
        <g id="tr-city-scene">
          <rect width="440" height="324" fill="#d5dfc5" />
          <path
            d="M0 111h163q6 0 6-6V0h102v105q0 6 6 6h163v102H277q-6 0-6 6v105H169V219q0-6-6-6H0Z"
            fill="#eae4d6"
          />
          <path
            d="M0 118h166q10 0 10-10V0h88v108q0 10 10 10h166v88H274q-10 0-10 10v108h-88V216q0-10-10-10H0Z"
            fill="#3a464b"
            stroke="#f3ecdf"
            strokeWidth="2"
          />
          <path
            d="M220 0v113m0 98v113M0 162h171m98 0h171"
            fill="none"
            stroke="#bcaa77"
            strokeWidth="1.25"
            strokeDasharray="8 7"
            opacity=".75"
          />
          <path d="M181 105h36m6 114h36m24-96v36m-126 6v36" stroke="#f3eee0" strokeWidth="2" />
          <use href="#tr-city-crosswalk" transform="translate(182 109)" />
          <use href="#tr-city-crosswalk" transform="translate(182 206)" />
          <use href="#tr-city-crosswalk" transform="translate(279 124) rotate(90)" />
          <use href="#tr-city-crosswalk" transform="translate(170 124) rotate(90)" />
          <path
            d="M193 42l5 6 5-6m-5 5V33m49 249-5-6-5 6m5-5v14m135-144-6-5 6-5m-5 5h14m-323 35 6 5-6 5m5-5H54"
            stroke="#cbd1cc"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".6"
          />

          {/* Corner buildings, a courtyard park, and a small plaza */}
          <path d="M0 13h153v84H0zM287 0h153v98H287zM0 226h150v98H0zM287 225h153v99H287z" fill="#c5d2b4" />
          <path
            d="M0 18h150v72H0m293-72h147m-146 70h146M0 238h147v86m149 0v-87h144"
            fill="none"
            stroke="#ece7d9"
            strokeWidth="7"
          />
          <g transform="translate(25 25)">
            <rect x="4" y="7" width="104" height="54" rx="3" fill="#7d755e" opacity=".32" />
            <rect width="103" height="53" rx="3" fill="#b9997c" />
            <rect x="3" y="2" width="97" height="42" rx="2" fill="#d9bb9b" stroke="#e6d0b3" strokeWidth="2" />
            <path d="M7 8h89M7 37h89M38 5v36m34-36v36" stroke="#bda180" strokeWidth="1.2" />
            <path d="M11 14h19v14H11zm35 0h18v14H46zm35 0h11v14H81z" fill="#ece0c7" stroke="#c4ac8e" />
            <path d="M7 49h12m6 0h12m28 0h12m6 0h12" stroke="#826f60" strokeWidth="2.6" />
            <path d="M44 45h14v8H44z" fill="#31877d" />
            <path d="M48 45v8m5-8v8" stroke="#d0e2cc" />
          </g>
          <use href="#tr-city-tree" x="12" y="23" />
          <use href="#tr-city-tree" x="12" y="51" />
          <use href="#tr-city-tree" x="141" y="31" />
          <use href="#tr-city-tree" x="141" y="61" />
          <use href="#tr-city-shrub" x="12" y="75" />
          <path d="M315 37h96v35h-96zm39-12h18v61h-18z" fill="#e4dfc5" />
          <ellipse cx="363" cy="54" rx="29" ry="23" fill="#ece4cf" stroke="#f6eee0" strokeWidth="2" />
          <ellipse cx="363" cy="54" rx="18" ry="13" fill="#8eb9b3" stroke="#b1cfbe" strokeWidth="3" />
          <ellipse cx="363" cy="54" rx="8" ry="5" fill="#67a4a7" stroke="#c2ddd4" />
          <circle cx="363" cy="54" r="2.2" fill="#edf5df" />
          <use href="#tr-city-tree" x="304" y="31" />
          <use href="#tr-city-tree" x="322" y="47" />
          <use href="#tr-city-tree" x="305" y="71" />
          <use href="#tr-city-tree" x="422" y="32" />
          <use href="#tr-city-tree" x="404" y="47" />
          <use href="#tr-city-tree" x="421" y="70" />
          <path d="M321 69h9m66 0h9" stroke="#9d7657" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="331" cy="80" r="2" fill="#b68376" />
          <circle cx="394" cy="81" r="2" fill="#b68376" />

          <g transform="translate(13 248)">
            <rect x="4" y="6" width="87" height="70" rx="3" fill="#82745f" opacity=".33" />
            <rect width="86" height="70" rx="3" fill="#9e8a79" />
            <rect x="2" y="2" width="82" height="60" rx="3" fill="#bfa897" stroke="#dcc5b2" strokeWidth="2" />
            <path d="M6 10h72v43H6z" fill="#cbb5a0" stroke="#ac9382" />
            <path d="M12 16h39v7H12zm0 13h39v7H12zm0 13h39v6H12z" fill="#718d93" stroke="#e0d8ca" />
            <path d="M16 16v32m7-32v32m7-32v32m7-32v32m7-32v32" stroke="#b1bcc0" opacity=".8" />
            <rect x="59" y="15" width="13" height="18" rx="2" fill="#dfd4c0" stroke="#ac9382" />
            <circle cx="65.5" cy="22" r="3" fill="#aeab9d" />
            <path d="M8 66h11m6 0h11m6 0h11m6 0h11" stroke="#6e7772" strokeWidth="2" />
          </g>
          <rect x="114" y="251" width="26" height="73" rx="4" fill="#a9b7ac" />
          <path d="M114 261h15m-15 12h15m-15 12h15m-15 12h15m-15 12h15" stroke="#e4e8d7" strokeWidth="1" />
          <use href="#tr-city-tree" x="110" y="239" />
          <use href="#tr-city-tree" x="148" y="262" />
          <use href="#tr-city-tree" x="148" y="302" />
          <use href="#tr-city-shrub" x="148" y="282" />
          <use href="#tr-city-shrub" x="105" y="299" />

          <rect
            x="311"
            y="248"
            width="121"
            height="72"
            rx="5"
            fill="#e2d7c0"
            stroke="#eae4d5"
            strokeWidth="2"
          />
          <path
            d="M318 252v64m16-64v64m16-64v64m16-64v64m16-64v64m16-64v64m16-64v64m-102-55h121m-121 16h121m-121 16h121m-121 16h121"
            stroke="#cfc4ae"
            strokeWidth=".75"
          />
          <rect x="339" y="260" width="69" height="37" rx="4" fill="#7c7564" opacity=".25" />
          <rect x="335" y="256" width="69" height="37" rx="3" fill="#e6c3a7" stroke="#b7997f" />
          <rect x="338" y="259" width="63" height="24" rx="2" fill="#cc916e" />
          <path d="M340 263h59m-59 4h59m-59 4h59m-59 4h59m-59 4h59" stroke="#aa6e56" strokeWidth="1" />
          <path d="M343 288h9m6 0h9m6 0h9m6 0h9" stroke="#89776c" strokeWidth="2.5" />
          <path d="M343 295h54" stroke="#e5a463" strokeWidth="4" strokeLinecap="round" />
          <use href="#tr-city-tree" x="309" y="256" />
          <use href="#tr-city-tree" x="321" y="305" />
          <use href="#tr-city-tree" x="425" y="254" />
          <use href="#tr-city-tree" x="424" y="304" />
          <use href="#tr-city-shrub" x="307" y="280" />

          <path
            d="M159 105h9m103 0h9m-121 114h9m103 0h9"
            stroke="#c4a466"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M155 118v-9m0 106v-9m130-88v-9m0 106v-9"
            stroke="#dad5bf"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </defs>
    </svg>
  );
}
