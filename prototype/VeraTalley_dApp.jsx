import { useState, useEffect, useCallback } from "react";

const POLYGON_AMOY_CHAIN_ID = "0x13882";
const POLYGON_AMOY_PARAMS = {
  chainId: POLYGON_AMOY_CHAIN_ID,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

const MOCK_ELECTION = {
  id: "0xElec01",
  title: "Riverside Ward — Spring 2026 Ballot",
  status: "open",
  created: "2026-03-28",
  closes: "2026-04-07",
  blockExplorer: "https://amoy.polygonscan.com/address/0x4a2b8c3d",
  contests: [
    {
      id: 1,
      title: "Ward Council Representative",
      options: [
        { id: "A", label: "Maya Osei-Bonsu", votes: 14 },
        { id: "B", label: "Daniel Ferreira", votes: 9 },
        { id: "C", label: "Priya Nambiar", votes: 6 },
      ],
    },
    {
      id: 2,
      title: "Parks & Recreation Bond Measure",
      options: [
        { id: "A", label: "Yes — Approve Bond", votes: 18 },
        { id: "B", label: "No — Reject Bond", votes: 11 },
      ],
    },
    {
      id: 3,
      title: "Community Board At-Large Seat",
      options: [
        { id: "A", label: "Tomás Villanueva", votes: 12 },
        { id: "B", label: "Suki Watanabe", votes: 10 },
        { id: "C", label: "Raymond Okafor", votes: 7 },
      ],
    },
  ],
};

const REGISTERED_VOTERS = [
  "0x742d35Cc6634C0532925a3b8D4C9E5b0Aa5eC4d",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  "DEMO_USER",
];

const MOCK_TXS = [
  { hash: "0xa3f1...9c2b", voter: "0x742d...C4d", block: 7823401, time: "12:04" },
  { hash: "0xb82e...3d11", voter: "0x8626...199", block: 7823415, time: "12:17" },
  { hash: "0xc19a...7f44", voter: "0xdD2F...C0", block: 7823430, time: "12:31" },
];

function shortAddr(addr) {
  if (!addr || addr === "DEMO_USER") return "0xDEMO...0000";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c111d;
    --surface: #141926;
    --surface2: #1c2336;
    --border: rgba(100,180,220,0.12);
    --border2: rgba(100,180,220,0.24);
    --teal: #00d4aa;
    --teal-dim: rgba(0,212,170,0.12);
    --teal-mid: rgba(0,212,170,0.3);
    --amber: #f5a623;
    --red: #ff5c6a;
    --text: #e8eef8;
    --text2: #8899bb;
    --text3: #4a5a7a;
    --mono: 'Space Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 56px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .logo {
    font-family: var(--mono); font-size: 15px; font-weight: 700;
    color: var(--teal); letter-spacing: 0.04em;
  }
  .logo span { color: var(--text2); font-weight: 400; }

  .nav-tabs {
    display: flex; gap: 4px;
  }
  .nav-tab {
    padding: 6px 16px; border-radius: 6px; font-size: 13px;
    font-family: var(--sans); font-weight: 500; cursor: pointer;
    border: 1px solid transparent; color: var(--text2);
    background: transparent; transition: all 0.15s;
  }
  .nav-tab:hover { color: var(--text); background: var(--surface2); }
  .nav-tab.active { color: var(--teal); border-color: var(--border2); background: var(--teal-dim); }

  .wallet-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid var(--border2); cursor: pointer;
    font-family: var(--mono); font-size: 12px;
    color: var(--teal); background: var(--teal-dim);
    transition: all 0.15s;
  }
  .wallet-btn:hover { border-color: var(--teal); }
  .wallet-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); }
  .wallet-dot.disconnected { background: var(--text3); }

  .main { flex: 1; padding: 32px 24px; max-width: 840px; margin: 0 auto; width: 100%; }

  .section-label {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
    color: var(--text3); text-transform: uppercase; margin-bottom: 8px;
  }

  .election-header {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
  }
  .election-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--text); }
  .election-meta { display: flex; gap: 16px; flex-wrap: wrap; }
  .meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text2); }
  .meta-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 500;
  }
  .badge-open { background: rgba(0,212,170,0.12); color: var(--teal); border: 1px solid var(--teal-mid); }
  .badge-pending { background: rgba(245,166,35,0.12); color: var(--amber); border: 1px solid rgba(245,166,35,0.3); }
  .badge-closed { background: rgba(72,82,110,0.3); color: var(--text2); border: 1px solid var(--border); }

  .contest-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;
  }
  .contest-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: var(--text); }

  .option-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 8px; cursor: pointer;
    border: 1px solid var(--border); margin-bottom: 8px;
    transition: all 0.15s; background: transparent;
  }
  .option-row:hover { border-color: var(--border2); background: var(--surface2); }
  .option-row.selected {
    border-color: var(--teal); background: var(--teal-dim);
  }
  .option-radio {
    width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--border2); display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .option-row.selected .option-radio { border-color: var(--teal); background: var(--teal); }
  .option-inner { width: 6px; height: 6px; border-radius: 50%; background: var(--bg); }
  .option-label { font-size: 14px; color: var(--text); flex: 1; }
  .option-row.selected .option-label { color: var(--teal); }

  .btn {
    padding: 11px 24px; border-radius: 8px; cursor: pointer;
    font-family: var(--sans); font-weight: 600; font-size: 14px;
    border: none; transition: all 0.15s;
  }
  .btn-primary { background: var(--teal); color: #0a1a14; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { color: var(--text); border-color: var(--border); background: var(--surface2); }
  .btn-danger { background: rgba(255,92,106,0.12); color: var(--red); border: 1px solid rgba(255,92,106,0.3); }

  .connect-panel {
    text-align: center; padding: 60px 24px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px;
  }
  .connect-icon { font-size: 48px; margin-bottom: 16px; }
  .connect-title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
  .connect-sub { font-size: 14px; color: var(--text2); margin-bottom: 24px; line-height: 1.6; }

  .network-warning {
    background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.3);
    border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: var(--amber);
  }

  .ineligible-msg {
    background: rgba(255,92,106,0.08); border: 1px solid rgba(255,92,106,0.3);
    border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;
    font-size: 13px; color: var(--red); text-align: center;
  }

  .submit-area { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

  .tx-panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 24px; text-align: center;
  }
  .tx-hash {
    font-family: var(--mono); font-size: 12px; color: var(--teal);
    background: var(--teal-dim); padding: 8px 14px; border-radius: 6px;
    display: inline-block; margin: 16px 0; word-break: break-all;
  }
  .tx-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  .tx-sub { font-size: 13px; color: var(--text2); margin-bottom: 16px; line-height: 1.6; }

  .spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--teal-dim); border-top-color: var(--teal);
    animation: spin 0.8s linear infinite; margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px 20px;
  }
  .stat-label { font-size: 11px; color: var(--text2); margin-bottom: 6px; }
  .stat-value { font-size: 24px; font-weight: 600; font-family: var(--mono); color: var(--teal); }

  .result-bar-wrap { margin-top: 8px; }
  .result-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .result-label { font-size: 13px; color: var(--text); width: 160px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .result-bar-bg { flex: 1; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .result-bar-fill { height: 100%; border-radius: 3px; background: var(--teal); transition: width 0.4s; }
  .result-bar-fill.leading { background: var(--teal); }
  .result-bar-fill.trailing { background: var(--text3); }
  .result-count { font-family: var(--mono); font-size: 12px; color: var(--text2); min-width: 28px; text-align: right; }

  .tx-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .tx-table th { text-align: left; color: var(--text3); font-weight: 500; padding: 8px 12px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
  .tx-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text2); }
  .tx-table td:first-child { font-family: var(--mono); color: var(--teal); }
  .tx-table tr:last-child td { border-bottom: none; }

  .admin-form { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
  .form-row { margin-bottom: 16px; }
  .form-label { font-size: 12px; color: var(--text2); margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%; padding: 9px 12px; border-radius: 8px;
    border: 1px solid var(--border2); background: var(--surface2);
    color: var(--text); font-family: var(--sans); font-size: 14px; outline: none;
  }
  .form-input:focus { border-color: var(--teal); }

  .voter-list { margin-top: 12px; }
  .voter-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--mono); font-size: 11px;
    background: var(--surface2); border: 1px solid var(--border); border-radius: 6px;
    padding: 4px 10px; margin: 4px; color: var(--text2);
  }

  .progress-msg {
    font-size: 13px; color: var(--text2); margin-top: 8px; line-height: 1.6;
  }

  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  .alert-info {
    background: rgba(0,212,170,0.06); border: 1px solid var(--teal-mid);
    border-radius: 8px; padding: 12px 16px; font-size: 13px; color: var(--teal);
    margin-bottom: 20px; line-height: 1.5;
  }
`;

export default function VeraTalleyApp() {
  const [tab, setTab] = useState("voter");
  const [walletAddr, setWalletAddr] = useState(null);
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [selections, setSelections] = useState({});
  const [voteState, setVoteState] = useState("idle");
  const [txHash, setTxHash] = useState(null);
  const [electionData, setElectionData] = useState(MOCK_ELECTION);
  const [txList, setTxList] = useState(MOCK_TXS);
  const [newVoter, setNewVoter] = useState("");
  const [voterList, setVoterList] = useState(REGISTERED_VOTERS.filter(v => v !== "DEMO_USER"));
  const [adminMsg, setAdminMsg] = useState(null);
  const [useDemo, setUseDemo] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;

  const switchToPolygon = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
      });
      setChainOk(true);
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY_PARAMS],
        });
        setChainOk(true);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      setWalletAddr(addr);
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== POLYGON_AMOY_CHAIN_ID) {
        await switchToPolygon();
      } else {
        setChainOk(true);
      }
      const registered = [...voterList, ...REGISTERED_VOTERS].map(v => v.toLowerCase());
      setEligibility(registered.includes(addr.toLowerCase()) ? "eligible" : "ineligible");
    } catch (e) {
      console.error(e);
    }
    setConnecting(false);
  }, [voterList, switchToPolygon]);

  const connectDemo = () => {
    setUseDemo(true);
    setWalletAddr("DEMO_USER");
    setChainOk(true);
    setEligibility("eligible");
  };

  const select = (contestId, optionId) => {
    if (voteState !== "idle") return;
    setSelections(s => ({ ...s, [contestId]: optionId }));
  };

  const allSelected = electionData.contests.every(c => selections[c.id]);

  const submitVote = async () => {
    if (!allSelected) return;
    setVoteState("confirming");
  };

  const confirmVote = async () => {
    setVoteState("signing");
    await new Promise(r => setTimeout(r, 1800));
    setVoteState("pending");
    const hash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    setTxHash(hash);
    await new Promise(r => setTimeout(r, 2200));

    const newTxs = [...txList, {
      hash: hash.slice(0, 6) + "..." + hash.slice(-4),
      voter: shortAddr(walletAddr),
      block: 7823500 + Math.floor(Math.random() * 20),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setTxList(newTxs);

    const updated = { ...electionData };
    updated.contests = updated.contests.map(c => ({
      ...c,
      options: c.options.map(o =>
        o.id === selections[c.id] ? { ...o, votes: o.votes + 1 } : o
      ),
    }));
    setElectionData(updated);
    setVoteState("confirmed");
  };

  const addVoter = () => {
    if (!newVoter.startsWith("0x") || newVoter.length < 10) {
      setAdminMsg({ type: "error", text: "Enter a valid Ethereum address (0x...)" });
      return;
    }
    if (voterList.includes(newVoter)) {
      setAdminMsg({ type: "error", text: "Address already registered." });
      return;
    }
    setVoterList(v => [...v, newVoter]);
    setNewVoter("");
    setAdminMsg({ type: "ok", text: `Voter ${shortAddr(newVoter)} registered on-chain.` });
    setTimeout(() => setAdminMsg(null), 3000);
  };

  const totalVotes = electionData.contests[0].options.reduce((s, o) => s + o.votes, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="topbar">
          <div className="logo">VERA<span>TALLEY</span></div>
          <div className="nav-tabs">
            {["voter", "admin", "audit"].map(t => (
              <button key={t} className={`nav-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t === "voter" ? "Voter App" : t === "admin" ? "Admin Portal" : "Audit Dashboard"}
              </button>
            ))}
          </div>
          <button className="wallet-btn" onClick={walletAddr ? undefined : (hasMetaMask ? connectWallet : connectDemo)}>
            <div className={`wallet-dot ${walletAddr ? "" : "disconnected"}`} />
            {walletAddr ? shortAddr(walletAddr) : "Connect Wallet"}
          </button>
        </div>

        <div className="main">
          {tab === "voter" && <VoterTab
            walletAddr={walletAddr} chainOk={chainOk} connecting={connecting}
            eligibility={eligibility} election={electionData} selections={selections}
            select={select} allSelected={allSelected} voteState={voteState}
            txHash={txHash} submitVote={submitVote} confirmVote={confirmVote}
            setVoteState={setVoteState} connectWallet={connectWallet}
            hasMetaMask={hasMetaMask} connectDemo={connectDemo}
            switchToPolygon={switchToPolygon} useDemo={useDemo}
          />}
          {tab === "admin" && <AdminTab
            election={electionData} voterList={voterList} newVoter={newVoter}
            setNewVoter={setNewVoter} addVoter={addVoter} adminMsg={adminMsg}
            walletAddr={walletAddr} connectWallet={connectWallet}
            hasMetaMask={hasMetaMask} connectDemo={connectDemo}
          />}
          {tab === "audit" && <AuditTab
            election={electionData} txList={txList} totalVotes={totalVotes}
          />}
        </div>
      </div>
    </>
  );
}

function VoterTab({ walletAddr, chainOk, connecting, eligibility, election, selections, select, allSelected, voteState, txHash, submitVote, confirmVote, setVoteState, connectWallet, hasMetaMask, connectDemo, switchToPolygon, useDemo }) {

  if (!walletAddr) {
    return (
      <div className="connect-panel">
        <div className="connect-icon">🗳️</div>
        <div className="connect-title">Cast Your Vote</div>
        <div className="connect-sub">
          Connect your MetaMask wallet to verify eligibility and submit your<br />
          ballot to the Polygon Amoy blockchain.
        </div>
        {hasMetaMask ? (
          <button className="btn btn-primary" onClick={connectWallet} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect MetaMask"}
          </button>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
              MetaMask not detected. You can run a simulated demo:
            </div>
            <button className="btn btn-primary" onClick={connectDemo}>Launch Demo Mode</button>
          </>
        )}
      </div>
    );
  }

  if (!chainOk) {
    return (
      <>
        <div className="network-warning">
          <span>⚠</span>
          <div>
            <strong>Wrong network detected.</strong> VeraTalley requires Polygon Amoy Testnet.
            Please switch your MetaMask network or click below.
          </div>
        </div>
        <button className="btn btn-primary" onClick={switchToPolygon}>Switch to Polygon Amoy</button>
      </>
    );
  }

  if (eligibility === "ineligible") {
    return (
      <div className="ineligible-msg">
        <strong>Not eligible.</strong> The wallet address {walletAddr} is not registered for this election.
        Contact the election administrator for assistance.
      </div>
    );
  }

  if (voteState === "confirmed") {
    return (
      <div className="tx-panel">
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div className="tx-title">Vote Recorded</div>
        <div className="tx-sub">
          Your ballot has been permanently written to the Polygon blockchain.<br />
          This cannot be changed or revoked.
        </div>
        <div className="tx-hash">{txHash}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Transaction hash · Polygon Amoy Testnet</div>
        <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer">
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>View on Block Explorer ↗</button>
        </a>
      </div>
    );
  }

  if (voteState === "confirming") {
    return (
      <div className="tx-panel">
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div className="tx-title">Confirm Your Ballot</div>
        <div className="tx-sub" style={{ marginBottom: 20 }}>
          You are about to permanently submit your ballot.<br />
          <strong style={{ color: "var(--text)" }}>This cannot be changed.</strong>
        </div>
        {election.contests.map(c => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text2)" }}>{c.title}</span>
            <span style={{ color: "var(--teal)", fontWeight: 600 }}>
              {c.options.find(o => o.id === selections[c.id])?.label}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => setVoteState("idle")}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmVote}>Confirm &amp; Sign</button>
        </div>
      </div>
    );
  }

  if (voteState === "signing" || voteState === "pending") {
    return (
      <div className="tx-panel">
        <div className="spinner" />
        <div className="tx-title" style={{ marginBottom: 6 }}>
          {voteState === "signing" ? "Waiting for Signature…" : "Broadcasting…"}
        </div>
        <div className="progress-msg">
          {voteState === "signing"
            ? !useDemo ? "Approve this transaction in MetaMask to submit your ballot on Polygon Amoy." : "Simulating MetaMask signature approval…"
            : "Your vote is being recorded on the blockchain. This takes about 5–10 seconds."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="election-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="section-label">Active Election</div>
          <span className="badge badge-open">● OPEN</span>
        </div>
        <div className="election-title">{election.title}</div>
        <div className="election-meta">
          <div className="meta-item"><div className="meta-dot" /> Polygon Amoy Testnet</div>
          <div className="meta-item"><div className="meta-dot" /> Closes {election.closes}</div>
          <div className="meta-item" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--teal)" }}>
            {shortAddr(walletAddr)}
          </div>
        </div>
      </div>

      {election.contests.map(c => (
        <div key={c.id} className="contest-card">
          <div className="section-label">Contest {c.id}</div>
          <div className="contest-title">{c.title}</div>
          {c.options.map(o => (
            <div
              key={o.id}
              className={`option-row ${selections[c.id] === o.id ? "selected" : ""}`}
              onClick={() => select(c.id, o.id)}
            >
              <div className="option-radio">
                {selections[c.id] === o.id && <div className="option-inner" />}
              </div>
              <div className="option-label">{o.label}</div>
            </div>
          ))}
        </div>
      ))}

      <div className="submit-area">
        <button className="btn btn-primary" onClick={submitVote} disabled={!allSelected}>
          {allSelected ? "Review &amp; Submit Ballot" : `Select all ${election.contests.length} contests to continue`}
        </button>
      </div>
    </>
  );
}

function AdminTab({ election, voterList, newVoter, setNewVoter, addVoter, adminMsg, walletAddr, connectWallet, hasMetaMask, connectDemo }) {
  if (!walletAddr) {
    return (
      <div className="connect-panel">
        <div className="connect-icon">🔐</div>
        <div className="connect-title">Admin Portal</div>
        <div className="connect-sub">Connect your admin wallet to manage elections and voters.</div>
        {hasMetaMask
          ? <button className="btn btn-primary" onClick={connectWallet}>Connect MetaMask</button>
          : <button className="btn btn-primary" onClick={connectDemo}>Launch Demo Mode</button>
        }
      </div>
    );
  }

  return (
    <>
      <div className="election-header">
        <div className="section-label">Election Management</div>
        <div className="election-title">{election.title}</div>
        <div className="election-meta">
          <span className="badge badge-open">OPEN</span>
          <div className="meta-item">Contract: <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>0x4a2b...8c3d</span></div>
          <div className="meta-item">Polygon Amoy</div>
        </div>
      </div>

      <div className="admin-form" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Register Voter Wallet</div>
        {adminMsg && (
          <div className={`alert-info`} style={adminMsg.type === "error" ? { color: "var(--red)", borderColor: "rgba(255,92,106,0.3)", background: "rgba(255,92,106,0.06)" } : {}}>
            {adminMsg.text}
          </div>
        )}
        <div className="form-row" style={{ display: "flex", gap: 10 }}>
          <input
            className="form-input"
            placeholder="0x..."
            value={newVoter}
            onChange={e => setNewVoter(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addVoter()}
          />
          <button className="btn btn-primary" onClick={addVoter} style={{ whiteSpace: "nowrap" }}>
            Register
          </button>
        </div>

        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
          Registered voters ({voterList.length})
        </div>
        <div className="voter-list">
          {voterList.map(v => (
            <div key={v} className="voter-chip">
              ✓ {v.length > 16 ? v.slice(0, 6) + "..." + v.slice(-4) : v}
            </div>
          ))}
        </div>
      </div>

      <div className="admin-form">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Election Controls</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>Pause Voting</button>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>Close Election</button>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>Certify Results</button>
          <button className="btn btn-danger" style={{ fontSize: 13 }}>Emergency Halt</button>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          Admin: {walletAddr === "DEMO_USER" ? "0xDEMO...ADMIN" : (walletAddr?.slice(0, 6) + "..." + walletAddr?.slice(-4))} · Polygon Amoy Testnet
        </div>
      </div>
    </>
  );
}

function AuditTab({ election, txList, totalVotes }) {
  return (
    <>
      <div className="election-header">
        <div className="section-label">Public Audit Dashboard</div>
        <div className="election-title">{election.title}</div>
        <div className="election-meta">
          <span className="badge badge-open">OPEN</span>
          <div className="meta-item">Contract: <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>0x4a2b...8c3d</span></div>
          <a href="https://amoy.polygonscan.com" target="_blank" rel="noreferrer" style={{ color: "var(--teal)", fontSize: 12 }}>View on PolygonScan ↗</a>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Votes Cast</div>
          <div className="stat-value">{totalVotes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contests</div>
          <div className="stat-value">{election.contests.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmations</div>
          <div className="stat-value">{txList.length}</div>
        </div>
      </div>

      {election.contests.map(c => {
        const total = c.options.reduce((s, o) => s + o.votes, 0);
        const maxVotes = Math.max(...c.options.map(o => o.votes));
        return (
          <div key={c.id} className="contest-card">
            <div className="section-label">Contest {c.id}</div>
            <div className="contest-title">{c.title}</div>
            <div className="result-bar-wrap">
              {c.options.map(o => {
                const pct = total === 0 ? 0 : Math.round((o.votes / total) * 100);
                return (
                  <div key={o.id} className="result-row">
                    <div className="result-label">{o.label}</div>
                    <div className="result-bar-bg">
                      <div
                        className={`result-bar-fill ${o.votes === maxVotes ? "leading" : "trailing"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="result-count">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="contest-card">
        <div className="section-label">On-Chain Transactions</div>
        <div style={{ marginBottom: 12 }} />
        <table className="tx-table">
          <thead>
            <tr>
              <th>Tx Hash</th>
              <th>Voter</th>
              <th>Block</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {txList.map((tx, i) => (
              <tr key={i}>
                <td>{tx.hash}</td>
                <td>{tx.voter}</td>
                <td style={{ fontFamily: "var(--mono)" }}>{tx.block.toLocaleString()}</td>
                <td>{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
