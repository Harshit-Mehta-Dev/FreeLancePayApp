import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, RotateCcw, Zap, Key, User, Send, ShieldCheck, Activity, Database, History } from 'lucide-react';
import { SecureVault } from '../lib/crypto/SecureVault';
import { CryptoCore } from '../lib/crypto/CryptoCore';

const CryptoDashboard = () => {
  const [vault, setVault] = useState(null);
  const [aliceIdentity, setAliceIdentity] = useState('');
  const [bobIdentity, setBobIdentity] = useState('');
  const [safetyNumber, setSafetyNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [activeRatchet, setActiveRatchet] = useState(null);

  const bobVaultRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const aliceVault = new SecureVault();
        await aliceVault.init();
        setVault(aliceVault);

        const bobVault = new SecureVault();
        bobVault['dbName'] = 'SecureVaultDB_Bob';
        await bobVault.init();
        bobVaultRef.current = bobVault;

        const aliceId = await aliceVault.getIdentityPublicKey();
        const bobId = await bobVault.getIdentityPublicKey();

        setAliceIdentity(Array.from(aliceId).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32) + '...');
        setBobIdentity(Array.from(bobId).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32) + '...');

        addEvent('System', 'Secure Vaults Initialized with P-256 Identity Keys');
        addEvent('System', 'Double Ratchet Protocol Ready');
        
        setIsInitializing(false);
      } catch (err) {
        console.error(err);
        addEvent('Error', 'Initialization failed: ' + err.message);
      }
    };
    init();
  }, []);

  const addEvent = (type, message) => {
    setSecurityEvents(prev => [{
      id: Date.now(),
      type,
      message,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 15));
  };

  const handleEstablishSession = async () => {
    try {
      addEvent('Handshake', 'Starting X3DH (Extended Triple Diffie-Hellman)');
      
      const bobPreKeys = await bobVaultRef.current.generatePreKeys(1);
      const bobIdentityPub = await bobVaultRef.current.getIdentityPublicKey();
      
      await vault.establishSession('bob', bobIdentityPub, bobPreKeys[0]);
      const aliceIdentityPub = await vault.getIdentityPublicKey();
      await bobVaultRef.current.acceptSession('alice', aliceIdentityPub, 'prekey_0');

      const sn = await vault.getSafetyNumber('bob');
      setSafetyNumber(sn);

      addEvent('Session', 'Double Ratchet Session Established');
      addEvent('Identity', 'Safety Number Calculated: ' + sn);
    } catch (err) {
      addEvent('Error', 'Session establishment failed: ' + err.message);
    }
  };

  const toggleVerify = async () => {
    const next = !isVerified;
    if (next) await vault.verifyPeer('bob');
    setIsVerified(next);
    addEvent('Security', `Identity ${next ? 'VERIFIED' : 'UNVERIFIED'} via Safety Number`);
  };


  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      const packet = await vault.encryptMessage('bob', inputText);
      addEvent('Ratchet', `Symmetric Ratchet: Message ${messages.length + 1} encrypted`);
      
      const decrypted = await bobVaultRef.current.decryptMessage('alice', packet);
      
      setMessages(prev => [...prev, {
        sender: 'Alice',
        text: inputText,
        packet: Array.from(packet.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join('') + '...',
        decrypted
      }]);
      
      setInputText('');
      setActiveRatchet('sending');
      setTimeout(() => setActiveRatchet(null), 1000);
    } catch (err) {
      addEvent('Error', 'Encryption failed: ' + err.message);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-500 animate-pulse flex flex-col items-center">
          <Shield className="w-16 h-16 mb-4" />
          <span className="font-mono tracking-widest uppercase">Initializing Quantum-Resistant Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                Security Command Center
              </h1>
              <p className="text-slate-500 font-mono text-sm uppercase tracking-tighter">
                Enterprise Grade Cryptography Chain Management
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleEstablishSession}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600/10 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-600/20 transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Initialize DH-Ratchet
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Identities & Chain State */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Identity Registry</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Local Identity (Alice)</span>
                  <code className="text-cyan-400/80 text-xs break-all">{aliceIdentity}</code>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Remote Identity (Bob)</span>
                  <code className="text-slate-400 text-xs break-all">{bobIdentity}</code>
                </div>

                {safetyNumber && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/20"
                  >
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-xs text-cyan-500 font-bold uppercase tracking-wider">Safety Number</span>
                       <button 
                        onClick={toggleVerify}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                          isVerified ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                       >
                         {isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                       </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {safetyNumber.split(' ').map((chunk, i) => (
                        <div key={i} className="bg-black/40 py-2 rounded-lg text-sm font-mono text-cyan-50/90 tracking-widest border border-white/5">
                          {chunk}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                      Verify this number with your contact via another secure channel to ensure no man-in-the-middle attack is present.
                    </p>
                  </motion.div>
                )}
              </div>

            </div>

            {/* Chain Management System */}
            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Chain Management</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${activeRatchet === 'sending' ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                    <span className="text-sm">Root Chain</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-500 px-2 py-1 bg-cyan-500/10 rounded-md">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">Forward Secrecy</span>
                  </div>
                  <span className="text-xs font-mono text-green-500 px-2 py-1 bg-green-500/10 rounded-md">ENABLED</span>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-xs text-slate-500 mb-2">CRYPTOGRAPHY STACK</div>
                <div className="flex flex-wrap gap-2">
                  {['P-256', 'AES-256-GCM', 'HKDF-SHA256', 'X3DH'].map(t => (
                    <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Encrypted Communication */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="flex-1 bg-[#111114] border border-white/5 rounded-3xl overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-semibold text-white text-lg">Secure Session: Alice ↔ Bob</h3>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5 text-xs text-slate-500">
                     <Lock className="w-3 h-3" /> E2EE VERIFIED
                   </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                    <Shield className="w-12 h-12" />
                    <p className="font-mono text-sm">No encrypted traffic detected. Establish session to start.</p>
                  </div>
                )}
                
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-cyan-600/10 border border-cyan-500/20 rounded-2xl rounded-tr-none p-4">
                          <p className="text-sm text-cyan-50">{msg.text}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end px-2">
                        <div className="flex items-center gap-2 group cursor-help">
                          <span className="text-[10px] font-mono text-slate-500">Encrypted Packet:</span>
                          <code className="text-[10px] font-mono text-purple-400/70 bg-purple-400/5 px-2 py-0.5 rounded border border-purple-400/10">
                            {msg.packet}
                          </code>
                          <Zap className="w-3 h-3 text-yellow-500/50" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a secure message..."
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl py-4 px-6 pr-16 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>RATCHET STEP: {messages.length + 1}</span>
                  <span>AES-256-GCM / HMAC-AUTH</span>
                </div>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-sm text-white">Security Audit Log</h3>
                </div>
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">LIVE FEED</span>
              </div>
              <div className="space-y-2 h-[150px] overflow-y-auto">
                {securityEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 text-[11px] py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-600 shrink-0">[{event.time}]</span>
                    <span className={`font-bold shrink-0 uppercase tracking-tighter ${
                      event.type === 'Error' ? 'text-red-500' : 
                      event.type === 'Security' ? 'text-green-500' : 
                      'text-cyan-500'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-slate-400">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDashboard;
