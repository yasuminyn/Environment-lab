import React, { useState, useEffect, useRef } from 'react';

const apiKey = "AIzaSyDdtVAzq3urrUtSwin9h_HqyHkhEfB0BaA"; 

// --- API Helpers (Updated to Gemini 1.5 Flash) ---
const fetchGeminiResponse = async (prompt, systemInstruction) => {
  let retries = 5; let delay = 1000;
  while (retries > 0) {
    try {
      if (!apiKey || apiKey === "AIzaSyDdtVAzq3urrUtSwin9h_HqyHkhEfB0BaA" || apiKey === "") {
         return "⚠️ คุณครูยังไม่ได้ใส่ API Key ในโค้ดบรรทัดที่ 3 ครับ! (AI เลยไม่มีสิทธิ์ตอบ)";
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          systemInstruction: { parts: [{ text: systemInstruction }] } 
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      retries--;
      if (retries === 0) return "ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว (หรืออาจจะเชื่อมต่อไม่ได้) ลองใหม่อีกครั้งนะครับ";
      await new Promise(res => setTimeout(res, delay)); delay *= 2;
    }
  }
};

const SYSTEM_PROMPT = `คุณคือ AI Socratic Social & Environment Tutor 
หน้าที่: กระตุ้นความคิดนักเรียนมัธยมปลายเรื่องสิ่งแวดล้อม การเมือง และนโยบายเมือง (บริบทไทยเทียบสิงคโปร์)
กฎเหล็ก:
1. ห้ามเฉลยตรงๆ ห้ามเขียนเรียงความให้
2. ยกกรณีสิงคโปร์มาเปรียบเทียบเสมอ (เช่น NEWater, Haze Act, Marina Barrage, Carbon Tax, HDB)
3. ชื่นชมก่อน แล้วตั้งคำถามต้อน (Socratic) 1-2 คำถาม เพื่อให้เด็กคิดเรื่องอำนาจ ความเหลื่อมล้ำ และทุนนิยม
4. เป็นมิตร สั้น กระชับ เน้นคำสำคัญ (Bold)`;

// --- อัปเดตระบบเสียงให้เสถียรขึ้น ---
const TTSButton = ({ text, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const handlePlay = () => {
        if ('speechSynthesis' in window) {
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH'; // เสียงภาษาไทย
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("เบราว์เซอร์ของคุณไม่รองรับระบบเสียงครับ");
        }
    };
    return (
        <button onClick={handlePlay} disabled={isPlaying} className={`flex items-center text-xs font-bold transition-all ${isPlaying ? 'text-indigo-400' : 'text-indigo-600 hover:text-indigo-800'} ${className}`}>
            <span className="text-base mr-1">{isPlaying ? "⏳" : "🔊"}</span>
            {isPlaying ? "กำลังพูด..." : "✨ ฟังเสียง AI"}
        </button>
    );
};

// --- STEP 0: LANDING PAGE (COVER) ---
const Step0Cover = ({ onStart, onJump }) => {
  const [activeModal, setActiveModal] = useState(null);

  const cardsInfo = [
    {
      id: 'politics', bgGradient: 'from-blue-100 to-blue-50', textHover: 'group-hover:text-blue-600', iconColor: 'text-blue-600',
      icon: "🏢", title: 'รัฐศาสตร์ & นโยบาย', desc: 'ใครคือผู้กำหนดทิศทางเมือง? อำนาจในการปกป้องพื้นที่เศรษฐกิจ แลกมากับการทอดทิ้งชุมชนดั้งเดิมหรือไม่?',
      details: 'เนื้อหาในส่วนนี้จะพานักเรียนไปสำรวจ "โครงสร้างอำนาจ" ผ่านสถานการณ์วิกฤต การตัดสินใจสร้างคันกั้นน้ำท่วม (Disaster Gentrification) ที่ต้องเลือกระหว่างการปกป้องศูนย์กลางเศรษฐกิจ หรือชุมชนรากหญ้า\n\nเปรียบเทียบกับ: นโยบายการจัดการสาธารณภัยของสิงคโปร์ (Marina Barrage)',
      targetStep: 4, targetName: 'ไปที่บทเรียน: วิกฤตน้ำท่วม'
    },
    {
      id: 'geo', bgGradient: 'from-emerald-100 to-emerald-50', textHover: 'group-hover:text-emerald-600', iconColor: 'text-emerald-600',
      icon: "🌿", title: 'ภูมิศาสตร์ & ทรัพยากร', desc: 'การจัดการน้ำ ฝุ่นควันข้ามแดน และการออกแบบพื้นที่สีเขียว (Biophilic Design) ในพื้นที่จำกัด',
      details: 'เรียนรู้หลักการจัดการทรัพยากรที่ขาดแคลน สวมบทวิศวกรระบบบำบัดน้ำเสีย (Mass Balance) และนักผังเมืองที่ต้องออกแบบพื้นที่สีเขียวเพื่อลดความเหลื่อมล้ำและเพิ่มคุณภาพชีวิตให้ประชากร\n\nเปรียบเทียบกับ: ระบบ NEWater และผังเมืองแบบ City in Nature',
      targetStep: 1, targetName: 'ไปที่บทเรียน: วิศวกรรมน้ำ'
    },
    {
      id: 'econ', bgGradient: 'from-purple-100 to-purple-50', textHover: 'group-hover:text-purple-600', iconColor: 'text-purple-600',
      icon: "💰", title: 'เศรษฐศาสตร์สิ่งแวดล้อม', desc: 'สำรวจทุนนิยมผูกขาด ค่าเสียโอกาสทางงบประมาณรัฐ และผลกระทบของ "ภาษีคาร์บอน" ต่อกลุ่มทุน',
      details: 'จำลองการเป็นรัฐมนตรีคลัง กำหนดอัตรา "ภาษีคาร์บอน" เพื่อท้าทายระบบทุนนิยม และค้นหาจุดสมดุลระหว่างการเติบโตทางเศรษฐกิจ (GDP) และความยั่งยืนของระบบนิเวศ\n\nเปรียบเทียบกับ: นโยบาย Carbon Tax ของสิงคโปร์',
      targetStep: 6, targetName: 'ไปที่บทเรียน: ภาษีคาร์บอน'
    },
    {
      id: 'ai', bgGradient: 'from-orange-100 to-orange-50', textHover: 'group-hover:text-orange-600', iconColor: 'text-orange-600',
      icon: "✨", title: 'AI Socratic Method', desc: 'ติวเตอร์ AI จะไม่ป้อนคำตอบ แต่จะตั้งคำถามกระตุ้น "การคิดเชิงวิพากษ์ (Critical Thinking)"',
      details: 'ทลายขีดจำกัดการเรียนรู้แบบเดิมๆ ด้วยห้องสนทนา "Socratic Townhall" ที่ให้ผู้เรียนได้ดีเบต ถกเถียง และแลกเปลี่ยนมุมมองนโยบายรัฐสวัสดิการกับ AI Socratic Tutor แบบเรียลไทม์ (รองรับระบบเสียงพูด)\n\nเปรียบเทียบกับ: นโยบาย Public Housing (HDB)',
      targetStep: 7, targetName: 'ไปที่บทเรียน: Townhall'
    }
  ];

  return (
    <div className="animate-fade-in bg-white rounded-3xl shadow-2xl overflow-hidden border-t-[10px] border-emerald-500 relative">
      <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-indigo-950 p-10 md:p-16 text-white text-center relative overflow-hidden">
        <div className="absolute top-8 left-8 text-8xl opacity-10 transform -rotate-12 blur-[2px]">🌿</div>
        <div className="absolute bottom-8 right-8 text-9xl opacity-10 transform rotate-6 blur-[1px]">🏢</div>
        <div className="absolute top-16 right-16 text-7xl opacity-10 animate-pulse">💨</div>
        <div className="absolute bottom-16 left-12 text-6xl opacity-10 transform rotate-12">💰</div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-8 border border-white/20 text-sm font-bold tracking-wide shadow-lg">
            <span className="text-2xl drop-shadow-md">🇹🇭</span>
            <span className="text-emerald-300">บริบทสังคมไทย</span>
            <span className="text-slate-400 font-light text-lg">X</span>
            <span className="text-indigo-300">โมเดลสิงคโปร์</span>
            <span className="text-2xl drop-shadow-md">🇸🇬</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
              Socratic Eco-Policy
            </span>
            <br />
            <span className="text-white">Masterclass</span>
          </h1>
          
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            ห้องปฏิบัติการจำลองนโยบายเมือง สิ่งแวดล้อม และผ่าโครงสร้างความเหลื่อมล้ำ
          </p>
        </div>
      </div>

      <div className="p-8 md:p-12 bg-slate-50 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white p-3 rounded-xl shadow-lg text-xl">
               💬
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 mt-2">"ทำไมกรุงเทพฯ ถึงไม่ใช่เมืองในสวน?"</h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              เรามักได้ยินว่า <strong>"สิงคโปร์"</strong> เป็นประเทศที่จัดการทรัพยากรดีอันดับต้นๆ ของโลก ทั้งการเปลี่ยนน้ำเสียเป็นน้ำดื่ม การสร้างคันกั้นน้ำทะเล หรือการเก็บภาษีคาร์บอน... 
              <br/><br/>
              แต่ในแล็บนี้ เราจะไม่ได้เรียนแค่ <i>"วิธีปลูกต้นไม้"</i> เราจะใช้ความสำเร็จของสิงคโปร์เป็น <strong>"ไม้บรรทัด (Benchmark)"</strong> เพื่อสะท้อนกลับมาตั้งคำถามกับ <strong>"โครงสร้างสังคมไทย"</strong> ว่าปัญหาสิ่งแวดล้อมที่เราเผชิญอยู่แท้จริงแล้วเกิดจากทรัพยากร หรือเกิดจาก <strong>"การเมือง ทุนนิยม และความเหลื่อมล้ำ"</strong> กันแน่?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {cardsInfo.map((card, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveModal(card)}
                  className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-start space-x-5 cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${card.bgGradient} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
                  <div className={`bg-gradient-to-br ${card.bgGradient} p-4 rounded-xl ${card.iconColor} group-hover:scale-110 transition-transform shadow-sm relative z-10 text-2xl`}>
                    {card.icon}
                  </div>
                  <div className="relative z-10">
                    <h3 className={`font-bold text-slate-800 text-base mb-2 ${card.textHover} transition-colors`}>{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                    <p className={`text-[10px] font-bold mt-3 ${card.iconColor} opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                      คลิกเพื่อดูรายละเอียด ➡️
                    </p>
                  </div>
                </div>
            ))}
          </div>

          <div className="text-center relative">
            <button onClick={onStart} className="group relative inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-bold py-5 px-12 rounded-full shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -ml-12 group-hover:animate-shimmer"></div>
              <span className="text-2xl mr-3 animate-pulse">📊</span> <span>เริ่มต้นการทดลอง (Start Masterclass)</span>
            </button>
            <p className="text-sm font-semibold text-slate-500 mt-5">ประกอบด้วย 7 บทเรียนจำลอง และ 1 ใบประกาศเกียรติบัตร</p>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${activeModal.bgGradient} p-6 flex items-center justify-between border-b border-slate-100`}>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-white/50 mr-3 shadow-sm ${activeModal.iconColor} text-xl`}>
                  {activeModal.icon}
                </div>
                <h3 className={`text-lg font-bold ${activeModal.iconColor}`}>{activeModal.title}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="text-3xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-6 font-medium">
                {activeModal.details}
              </p>
              <div className="flex space-x-3">
                <button onClick={() => setActiveModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm">
                  ปิดหน้าต่าง
                </button>
                <button onClick={() => { setActiveModal(null); onJump(activeModal.targetStep); }} className={`flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm flex justify-center items-center`}>
                  {activeModal.targetName} ➡️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STEP 1: WATER MANAGEMENT LAB ---
const INITIAL_WATER = { tss: 1000, tds: 2000, pathogens: 1000000 };
const FILTERS = [
  { id: 'MF', name: 'Microfiltration', color: 'bg-blue-500', icon: '🕸️', desc: 'ดักกากหยาบ (ลด TSS 95%)' },
  { id: 'RO', name: 'Reverse Osmosis', color: 'bg-indigo-600', icon: '💧', desc: 'กรองระดับไอออน (ลด TDS)' },
  { id: 'UV', name: 'UV Disinfection', color: 'bg-purple-500', icon: '☀️', desc: 'ฆ่าเชื้อด้วยแสง' }
];

const Step1WaterLab = ({ onComplete }) => {
    const [pipeline, setPipeline] = useState([null, null, null]);
    const [simulationStatus, setSimulationStatus] = useState('IDLE');
    const [waterStats, setWaterStats] = useState([INITIAL_WATER]);
    const [healthIndex, setHealthIndex] = useState(100);
    const [budget, setBudget] = useState(5000000);
    const [logs, setLogs] = useState([]);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
  
    const clearResults = () => { setSimulationStatus('IDLE'); setWaterStats([INITIAL_WATER]); setLogs([]); setAiFeedback(null); };
    const fullReset = () => { setPipeline([null, null, null]); clearResults(); setHealthIndex(100); setBudget(5000000); };
    const addFilter = (filter) => { const emptyIndex = pipeline.indexOf(null); if (emptyIndex !== -1) { const newP = [...pipeline]; newP[emptyIndex] = filter; setPipeline(newP); clearResults(); } };
    const removeFilter = (index) => { const newP = [...pipeline]; newP[index] = null; setPipeline(newP); clearResults(); };
  
    const runSimulation = () => {
      if (pipeline.every(f => f === null)) return alert("กรุณาติดตั้งฟิลเตอร์อย่างน้อย 1 ด่านครับ!");
      let currentWater = { ...INITIAL_WATER }, newStats = [currentWater], newLogs = ["เริ่มปล่อยน้ำเสีย..."], currentBudget = budget;
      let failed = false, finalStatus = 'IDLE', finalHealth = 100;
  
      for (let i = 0; i < 3; i++) {
        const filter = pipeline[i]; let nextW = { ...currentWater };
        if (!filter) newLogs.push(`ด่าน ${i+1} [ว่าง]: น้ำไหลผ่านเฉยๆ`);
        else if (filter.id === 'MF') { nextW.tss *= 0.05; newLogs.push(`ด่าน ${i+1} [MF]: กรองตะกอน (TSS) ออก 95%`); } 
        else if (filter.id === 'RO') {
          if (currentWater.tss > 100) { finalStatus = 'FAILED_FOULING'; newLogs.push(`❌ วิกฤต! ตะกอนสูง เมมเบรน RO ฉีกขาด!`); currentBudget -= 2000000; setBudget(currentBudget); failed = true; break; }
          else { nextW.tds *= 0.01; nextW.pathogens *= 0.001; newLogs.push(`ด่าน ${i+1} [RO]: กรองระดับไอออนด้วยแรงดัน`); }
        } 
        else if (filter.id === 'UV') {
          if (currentWater.tss > 50) { nextW.pathogens *= 0.8; newLogs.push(`⚠️ แจ้งเตือน: น้ำขุ่น UV ทำงานได้แค่ 20%!`); }
          else { nextW.pathogens *= 0.0001; newLogs.push(`ด่าน ${i+1} [UV]: UV ฆ่าเชื้อโรคสมบูรณ์`); }
        }
        currentWater = nextW; newStats.push(currentWater);
      }
      setWaterStats(newStats);
      if (!failed) {
        if (currentWater.tss <= 50 && currentWater.tds <= 500 && currentWater.pathogens <= 10) { finalStatus = 'SUCCESS'; newLogs.push(`✅ ผ่านมาตรฐานน้ำสะอาด (NEWater)!`); finalHealth = 100; } 
        else { finalStatus = 'FAILED_QUALITY'; newLogs.push(`❌ ไม่ผ่านมาตรฐาน เชื้อโรคหลุดรอด!`); finalHealth = Math.max(10, 100 - (currentWater.pathogens > 1000 ? 60 : 30)); }
      } else finalHealth = 30;
  
      setSimulationStatus(finalStatus); setHealthIndex(finalHealth); setLogs(newLogs);
    };
  
    const handleAskAITutor = async () => {
      setIsAnalyzing(true);
      const usedFilters = pipeline.map(f => f ? f.id : 'ว่าง').join(' -> ');
      const res = await fetchGeminiResponse(`เด็กจัดท่อ: ${usedFilters} | ผล: ${simulationStatus} | วิเคราะห์วิศวกรรมน้ำด้วย Socratic Method โยงหลัก Mass Balance และ NEWater สิงคโปร์`, SYSTEM_PROMPT);
      setAiFeedback(res); setIsAnalyzing(false);
    };
  
    return (
      <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
        <div className="flex items-center mb-4 text-blue-600"><span className="text-2xl mr-2">💧</span><h2 className="text-xl font-bold text-slate-800">บทที่ 1: วิศวกรรมน้ำ (Wastewater to Wealth)</h2></div>
        <p className="text-sm text-slate-600 mb-6">หลักการ Mass Balance: เลือกลำดับฟิลเตอร์ให้ถูกต้อง หากเรียงผิดระบบจะพังและเกิดโรคระบาดในเมือง</p>
        <div className="flex space-x-3 mb-6">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => addFilter(f)} disabled={pipeline.includes(f) || pipeline.filter(p=>p).length === 3}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${pipeline.includes(f) ? 'border-slate-200 bg-slate-50 opacity-50' : `border-slate-200 hover:border-${f.color.split('-')[1]}-500 bg-white`}`}>
              <div className="text-xl mb-1">{f.icon}</div><div className="font-bold text-xs text-slate-700">{f.name}</div>
            </button>
          ))}
        </div>
        <div className="relative flex items-center justify-between bg-slate-100 p-4 rounded-xl overflow-x-auto min-w-[500px] mb-6">
          <div className="absolute left-0 right-0 h-3 bg-slate-300 top-1/2 transform -translate-y-1/2 z-0"></div>
          <div className="z-10 bg-slate-800 text-white p-2 rounded-lg shadow-lg w-28 shrink-0 text-xs">
            <div className="font-bold text-amber-500 mb-1">น้ำเสีย (In)</div><div>TSS: {INITIAL_WATER.tss}</div><div>TDS: {INITIAL_WATER.tds}</div>
          </div>
          {pipeline.map((filter, idx) => (
            <React.Fragment key={idx}>
              <span className="z-10 text-slate-400 text-xl shrink-0 mx-2">➡️</span>
              <div onClick={() => filter && removeFilter(idx)} className={`z-10 w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer bg-white shrink-0 ${filter ? `border-${filter.color.split('-')[1]}-500 shadow-md` : 'border-dashed border-slate-300'}`}>
                {filter ? <div className="font-bold text-xs">{filter.id}</div> : <div className="text-slate-400 text-[10px]">ด่าน {idx + 1}</div>}
              </div>
            </React.Fragment>
          ))}
          <span className="z-10 text-slate-400 text-xl shrink-0 mx-2">➡️</span>
          <div className="z-10 bg-emerald-50 text-emerald-900 p-2 rounded-lg shadow-lg w-28 shrink-0 text-xs">
            <div className="font-bold text-emerald-600 mb-1">น้ำสะอาด (Out)</div>
            <div>TSS: <span className={waterStats[waterStats.length-1]?.tss > 50 ? 'text-red-500' : ''}>{waterStats[waterStats.length-1]?.tss?.toFixed(0)}</span></div>
            <div>TDS: <span className={waterStats[waterStats.length-1]?.tds > 500 ? 'text-red-500' : ''}>{waterStats[waterStats.length-1]?.tds?.toFixed(0)}</span></div>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          <button onClick={runSimulation} disabled={simulationStatus !== 'IDLE' && simulationStatus !== 'FAILED_QUALITY' && simulationStatus !== 'SUCCESS'} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-6 rounded-full transition-all flex items-center disabled:opacity-50"><span className="mr-2">📊</span> เดินเครื่อง!</button>
          <button onClick={fullReset} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-2 px-4 rounded-full transition-all flex items-center"><span className="mr-2">🔄</span> รีเซ็ต</button>
        </div>
        {simulationStatus !== 'IDLE' && (
          <div className={`p-5 rounded-xl border-2 ${simulationStatus === 'SUCCESS' ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center mb-3">
               <span className="text-2xl mr-2">{simulationStatus === 'SUCCESS' ? '✅' : '⚠️'}</span>
               <h3 className={`font-bold text-lg ${simulationStatus === 'SUCCESS' ? 'text-emerald-800' : 'text-red-800'}`}>{simulationStatus === 'SUCCESS' ? 'ระบบบำบัดน้ำทำงานสมบูรณ์!' : 'ระบบล้มเหลว!'}</h3>
            </div>
            <div className="space-y-1 mb-4">{logs.map((log, idx) => <div key={idx} className="text-[11px] font-mono bg-white p-1.5 rounded shadow-sm border border-slate-200 text-slate-600">{log}</div>)}</div>
            {simulationStatus === 'SUCCESS' && (<button onClick={onComplete} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold py-3 rounded-xl flex justify-center items-center transition-all shadow-md mb-4 animate-bounce-short">ผ่านด่านสำเร็จ! เข้าสู่บทถัดไป ➡️</button>)}
            <div className="border-t border-slate-200 pt-3">
              {!aiFeedback ? (
                  <button onClick={handleAskAITutor} disabled={isAnalyzing} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center transition-all underline"><span className="mr-1">✨</span> {isAnalyzing ? "AI กำลังวิเคราะห์..." : "อยากรู้ไหมทำไมถึงเป็นแบบนี้? (ฟัง AI อธิบาย)"}</button>
              ) : (
                  <div className="p-4 bg-white rounded-xl text-indigo-900 text-sm whitespace-pre-line border border-indigo-200 shadow-inner"><div className="flex items-center justify-between mb-2"><span className="font-bold flex items-center text-indigo-700">💡 คำอธิบายจาก AI Tutor:</span><TTSButton text={aiFeedback} /></div>{aiFeedback}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
};

const Step2PM25 = ({ onComplete }) => {
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const policies = [
      { id: 'A', text: 'ส่งตำรวจลงพื้นที่จับกุมเกษตรกรที่เผาป่าทันที (Zero Tolerance)' },
      { id: 'B', text: 'รัฐนำภาษีไปอุดหนุนซื้อรถไถกลบตอซังให้เกษตรกรฟรี' },
      { id: 'C', text: 'ออกกฎหมายเอาผิด "กลุ่มทุนใหญ่" ที่รับซื้อจากพื้นที่เผาป่า (Supply Chain Law)' }
    ];
    const handleSubmit = async () => {
      setLoading(true);
      const res = await fetchGeminiResponse(`นักเรียนเลือกนโยบายแก้ฝุ่น PM2.5: "${policies.find(p => p.id === selectedPolicy).text}" วิเคราะห์แบบ Socratic โยง Transboundary Haze Act สิงคโปร์`, SYSTEM_PROMPT);
      setFeedback(res); setLoading(false);
    };
    return (
      <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border-t-4 border-orange-500">
        <div className="flex items-center mb-4 text-orange-600"><span className="text-2xl mr-2">💨</span><h2 className="text-xl font-bold text-slate-800">บทที่ 2: วิกฤตฝุ่นควันข้ามแดน (PM 2.5)</h2></div>
        <p className="text-sm text-slate-600 mb-4">คุณจะจัดการปัญหานายทุน vs เกษตรกร อย่างไร?</p>
        <div className="space-y-3 mb-6">
          {policies.map(p => (
            <label key={p.id} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${selectedPolicy === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="policy" className="mt-1 mr-3 text-orange-500 focus:ring-orange-500" checked={selectedPolicy === p.id} onChange={() => setSelectedPolicy(p.id)} />
              <span className="text-sm font-medium text-slate-700">{p.text}</span>
            </label>
          ))}
        </div>
        {!feedback ? (
          <button onClick={handleSubmit} disabled={!selectedPolicy || loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50 transition-all shadow-md">{loading ? 'กำลังประเมินนโยบาย...' : 'ส่งให้ AI ประเมิน'}</button>
        ) : (
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-inner">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-indigo-700 flex items-center">💡 AI Socratic Feedback:</h3><TTSButton text={feedback} /></div>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{feedback}</p>
            <button onClick={onComplete} className="mt-5 w-full bg-orange-600 hover:bg-orange-700 text-white text-base font-bold py-3 rounded-xl flex justify-center items-center transition-all shadow-md">เข้าใจแล้ว เข้าสู่บทถัดไป ➡️</button>
          </div>
        )}
      </div>
    );
};

const Step3GreenSpace = ({ onComplete }) => {
    const [budget, setBudget] = useState(100); 
    const [greenScore, setGreenScore] = useState(10); const [equalityScore, setEqualityScore] = useState(20);
    const [feedback, setFeedback] = useState(""); const [loading, setLoading] = useState(false);
    const [purchases, setPurchases] = useState({ mega: 0, pocket: 0 });
    const buyMegaPark = () => { if (budget >= 50) { setBudget(b => b - 50); setGreenScore(g => g + 40); setEqualityScore(e => e - 10); setPurchases(p => ({ ...p, mega: p.mega + 1 })); } };
    const buyPocketPark = () => { if (budget >= 10) { setBudget(b => b - 10); setGreenScore(g => g + 15); setEqualityScore(e => e + 15); setPurchases(p => ({ ...p, pocket: p.pocket + 1 })); } };
    const handleSubmit = async () => {
      setLoading(true);
      const res = await fetchGeminiResponse(`ใช้งบ 100ล้าน สร้าง Mega Park ${purchases.mega} แห่ง, Pocket Park ${purchases.pocket} แห่ง ความเหลื่อมล้ำ ${equalityScore}% ประเมินแบบ Socratic โยง Park Connector สิงคโปร์`, SYSTEM_PROMPT);
      setFeedback(res); setLoading(false);
    };
    return (
      <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border-t-4 border-emerald-500">
        <div className="flex items-center mb-4 text-emerald-600"><span className="text-2xl mr-2">🌲</span><h2 className="text-xl font-bold text-slate-800">บทที่ 3: ผังเมือง และ ความเหลื่อมล้ำ</h2></div>
        <p className="text-sm text-slate-600 mb-4">งบพัฒนาเมือง 100 ล้าน! สร้างพื้นที่สีเขียวแบบไหนให้ตอบโจทย์คนทั้งเมือง?</p>
        <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl mb-6 shadow-inner">
          <div className="text-center"><p className="text-xs text-slate-500 font-bold">งบประมาณเหลือ</p><p className="text-xl font-bold text-slate-800">{budget} ล้าน</p></div>
          <div className="text-center"><p className="text-xs text-slate-500 font-bold">ความร่มรื่น</p><p className="text-xl font-bold text-emerald-600">{greenScore}%</p></div>
          <div className="text-center"><p className="text-xs text-slate-500 font-bold">ความเท่าเทียม</p><p className={`text-xl font-bold ${equalityScore < 30 ? 'text-red-500' : 'text-blue-600'}`}>{equalityScore}%</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={buyMegaPark} disabled={budget < 50 || feedback !== ""} className="p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 text-left transition-all disabled:opacity-50 hover:shadow-md"><div className="text-3xl mb-2">🏢</div><h3 className="font-bold text-sm">สร้าง Mega Park</h3><p className="text-xs text-slate-500 mt-1">ราคา: 50 ล้าน<br/>คนชานเมืองเข้าถึงยาก</p></button>
          <button onClick={buyPocketPark} disabled={budget < 10 || feedback !== ""} className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 text-left transition-all disabled:opacity-50 hover:shadow-md"><div className="text-3xl mb-2">👥</div><h3 className="font-bold text-sm">สร้าง Pocket Parks</h3><p className="text-xs text-slate-500 mt-1">ราคา: 10 ล้าน<br/>กระจายร่มรื่น ลดเหลื่อมล้ำ</p></button>
        </div>
        {!feedback ? (
          <button onClick={handleSubmit} disabled={budget === 100 || loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center shadow-md disabled:opacity-50">{loading ? "กำลังวิเคราะห์..." : "ยืนยันจัดสรรงบ"}</button>
        ) : (
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 shadow-inner">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-indigo-700 flex items-center">💡 AI Socratic Feedback:</h3><TTSButton text={feedback} /></div>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{feedback}</p>
            <button onClick={onComplete} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold py-3 rounded-xl flex justify-center items-center transition-all shadow-md">เข้าสู่บทถัดไป: วิกฤตน้ำท่วม ➡️</button>
          </div>
        )}
      </div>
    );
};

const Step4FloodWall = ({ onComplete }) => {
    const [cbdWall, setCbdWall] = useState(50);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const communityWall = 100 - cbdWall; 
    const cbdFlooded = cbdWall < 60; const communityFlooded = communityWall < 60;
  
    const handleSubmit = async () => {
      setLoading(true);
      const floodedZone = (cbdFlooded && communityFlooded) ? "ทั้งสองโซน" : (cbdFlooded ? "โซนเศรษฐกิจ" : (communityFlooded ? "โซนชุมชน" : "ไม่มี"));
      const res = await fetchGeminiResponse(`สร้างกำแพง CBD ${cbdWall}%, ชุมชน ${communityWall}% ส่งผลให้ "${floodedZone}" น้ำท่วมมิด วิเคราะห์ Socratic โยง Disaster Gentrification และ Marina Barrage สิงคโปร์`, SYSTEM_PROMPT);
      setFeedback(res); setLoading(false);
    };
  
    return (
      <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border-t-4 border-cyan-600">
        <div className="flex items-center mb-4 text-cyan-700"><span className="text-2xl mr-2">🌊</span><h2 className="text-xl font-bold text-slate-800">บทที่ 4: วิกฤตน้ำท่วม และ ความเหลื่อมล้ำ</h2></div>
        <p className="text-sm text-slate-600 mb-2">วัสดุ "คันกั้นน้ำ" จำกัด 100 หน่วย เลือกว่าจะปกป้อง "โซนเศรษฐกิจ" หรือ "โซนชุมชน"</p>
        <p className="text-xs text-cyan-600 mb-6 font-bold">(หากคันกั้นน้ำต่ำกว่า 60 หน่วย โซนนั้นจะถูกน้ำท่วมมิด)</p>
  
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className={`w-full md:w-1/2 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${cbdFlooded ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
                {cbdFlooded && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-cyan-500/30 animate-pulse"></div>}
                <div className="relative z-10"><div className="flex justify-between items-center mb-2"><span className="text-3xl text-slate-700">🏢</span><span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded">โซนเศรษฐกิจ (CBD)</span></div><div className="flex items-center"><div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden mr-2 border border-slate-300"><div className="bg-slate-700 h-full transition-all" style={{width: `${cbdWall}%`}}></div></div><span className="text-sm font-bold w-8">{cbdWall}</span></div>{cbdFlooded ? <p className="text-xs text-red-600 mt-2 font-bold animate-pulse">🌊 น้ำท่วม! ห้างปิด GDP ร่วง!</p> : <p className="text-xs text-emerald-600 mt-2 font-bold">🛡️ ปลอดภัย! เศรษฐกิจเดินหน้า</p>}</div>
            </div>
            <div className={`w-full md:w-1/2 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${communityFlooded ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
                {communityFlooded && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-cyan-500/30 animate-pulse"></div>}
                <div className="relative z-10"><div className="flex justify-between items-center mb-2"><span className="text-3xl text-amber-600">👥</span><span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">โซนชุมชน (Community)</span></div><div className="flex items-center"><div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden mr-2 border border-slate-300"><div className="bg-amber-600 h-full transition-all" style={{width: `${communityWall}%`}}></div></div><span className="text-sm font-bold w-8">{communityWall}</span></div>{communityFlooded ? <p className="text-xs text-red-600 mt-2 font-bold animate-pulse">🌊 น้ำท่วม! ชาวบ้านไร้ที่อยู่!</p> : <p className="text-xs text-emerald-600 mt-2 font-bold">🛡️ ปลอดภัย! ชาวบ้านปลอดภัย</p>}</div>
            </div>
        </div>
        <div className="mb-6 px-4"><input type="range" min="0" max="100" step="10" value={cbdWall} onChange={(e) => setCbdWall(parseInt(e.target.value))} disabled={feedback !== ""} className="w-full h-3 bg-gradient-to-r from-slate-700 to-amber-600 rounded-lg appearance-none cursor-pointer" /></div>
        {!feedback ? (
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center shadow-md">{loading ? "กำลังจำลองสถานการณ์..." : "ยืนยันการวางคันกั้นน้ำ"}</button>
        ) : (
          <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200 shadow-inner">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-indigo-700 flex items-center">💡 AI Socratic Feedback:</h3><TTSButton text={feedback} /></div>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{feedback}</p>
            <button onClick={onComplete} className="mt-4 w-full bg-cyan-700 hover:bg-cyan-800 text-white text-base font-bold py-3 rounded-xl flex justify-center items-center transition-all shadow-md">ดูผลลัพธ์เมือง 3 มิติ ➡️</button>
          </div>
        )}
      </div>
    );
};

const Step5CityInNature3D = ({ onComplete }) => {
    const mountRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const targetProgressRef = useRef(0);
  
    useEffect(() => { targetProgressRef.current = progress / 100; }, [progress]);
  
    useEffect(() => {
      let scene, camera, renderer, clock, frameId;
      let buildings = [], trees = [], supertrees = [], water;
      let currentProgress = 0; let isMounted = true; let resizeListener;
      
      const colors = { skyPolluted: 0x3a3a3a, skyClean: 0x1a0b2e, waterPolluted: 0x2d2419, waterClean: 0x0f5e9c, buildingPolluted: 0x222222, buildingClean: 0xdddddd, fogPolluted: 0x4a4a4a, fogClean: 0x1a0b2e };
  
      const init3D = () => {
          const THREE = window.THREE;
          if(!THREE || !mountRef.current || !isMounted) return;
          const width = mountRef.current.clientWidth; const height = mountRef.current.clientHeight;
          if (width === 0 || height === 0) { setTimeout(init3D, 100); return; }
          mountRef.current.innerHTML = '';
          
          clock = new THREE.Clock(); scene = new THREE.Scene(); scene.background = new THREE.Color(colors.skyPolluted); scene.fog = new THREE.FogExp2(colors.fogPolluted, 0.012);
          camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000); camera.position.set(0, 45, 90); camera.lookAt(0, 10, 0);
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(width, height); renderer.shadowMap.enabled = true;
          mountRef.current.appendChild(renderer.domElement);
          scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.5));
          const dirLight = new THREE.DirectionalLight(0xffffff, 0.6); dirLight.position.set(50, 100, 20); dirLight.castShadow = true; scene.add(dirLight);
  
          const waterGeo = new THREE.PlaneGeometry(300, 300, 32, 32); const posAttr = waterGeo.attributes.position;
          for (let i = 0; i < posAttr.count; i++) posAttr.setZ(i, Math.random() * 0.5); waterGeo.computeVertexNormals();
          water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: colors.waterPolluted, transparent: true, opacity: 0.9, flatShading: true }));
          water.rotation.x = -Math.PI / 2; water.position.y = -0.5; scene.add(water);
  
          const createTree = (x, z, delay) => {
              const group = new THREE.Group(); group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0x4a3b2c })));
              const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), new THREE.MeshStandardMaterial({ color: 0x2e8b57, flatShading: true })); leaves.position.y = 1.8;
              group.add(leaves); group.position.set(x, 1, z); group.scale.set(0,0,0); scene.add(group); trees.push({ mesh: group, delay: delay });
          };
  
          const createSupertree = (x, z, delay) => {
              const group = new THREE.Group(); const h = 15 + Math.random() * 10;
              const tMat = new THREE.MeshStandardMaterial({ color: 0x6a0dad, wireframe: true, emissive: 0xff00ff, emissiveIntensity: 0 });
              const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.5, h, 8, 2, true), tMat); trunk.position.y = h/2;
              const cMat = new THREE.MeshStandardMaterial({ color: 0x32cd32, side: THREE.DoubleSide, transparent: true, opacity: 0.8, emissive: 0x00ff00, emissiveIntensity: 0 });
              const canopy = new THREE.Mesh(new THREE.CylinderGeometry(6, 1, 3, 12, 1, true), cMat); canopy.position.y = h;
              group.add(trunk); group.add(canopy); group.position.set(x, 0, z); group.scale.set(0.001,0.001,0.001); scene.add(group); supertrees.push({ mesh: group, delay: delay, tMat, cMat });
          };
  
          for (let i = 0; i < 60; i++) {
              const mat = new THREE.MeshStandardMaterial({ color: colors.buildingPolluted, emissive: 0x00ffff, emissiveIntensity: 0 });
              const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
              const w = 2+Math.random()*4, d = 2+Math.random()*4, h = 10+Math.random()*30; mesh.position.set((Math.random()-0.5)*120, h/2, (Math.random()-0.5)*60 - 20); mesh.scale.set(w, h, d);
              scene.add(mesh); buildings.push({ mesh, hasLights: Math.random() > 0.5 }); if(Math.random() > 0.2) createTree(mesh.position.x + (Math.random()-0.5)*8, mesh.position.z + (Math.random()-0.5)*8, Math.random()*0.5);
          }
          [{x: -15, z: 5}, {x: 15, z: 10}, {x: 0, z: -10}, {x: -25, z: -5}, {x: 25, z: -5}].forEach((p,i) => createSupertree(p.x, p.z, i*0.15));
          
          resizeListener = () => { if (!mountRef.current || !camera || !renderer) return; const newW = mountRef.current.clientWidth; const newH = mountRef.current.clientHeight; camera.aspect = newW / newH; camera.updateProjectionMatrix(); renderer.setSize(newW, newH); }; window.addEventListener('resize', resizeListener);
  
          const animate = () => {
              if (!isMounted) return; frameId = requestAnimationFrame(animate); const target = targetProgressRef.current; currentProgress += (target - currentProgress) * 0.05; 
              scene.background = new THREE.Color().setHex(colors.skyPolluted).lerp(new THREE.Color().setHex(colors.skyClean), currentProgress); scene.fog.color = new THREE.Color().setHex(colors.fogPolluted).lerp(new THREE.Color().setHex(colors.fogClean), currentProgress); water.material.color = new THREE.Color().setHex(colors.waterPolluted).lerp(new THREE.Color().setHex(colors.waterClean), currentProgress); const bColor = new THREE.Color().setHex(colors.buildingPolluted).lerp(new THREE.Color().setHex(colors.buildingClean), currentProgress);
              buildings.forEach(b => { b.mesh.material.color = bColor; if(b.hasLights) b.mesh.material.emissiveIntensity = Math.max(0, (currentProgress - 0.5) * 2); }); trees.forEach(t => { let p = Math.max(0, Math.min(1, (currentProgress - t.delay)/(1 - t.delay))); t.mesh.scale.set(p, p, p); }); supertrees.forEach(st => { let p = Math.max(0, Math.min(1, (currentProgress - st.delay)/(1 - st.delay))); st.mesh.scale.set(Math.max(0.001, p), Math.max(0.001, p), Math.max(0.001, p)); st.tMat.emissiveIntensity = currentProgress * 0.8; st.cMat.emissiveIntensity = currentProgress * 0.5; });
              camera.position.x = Math.sin(clock.getElapsedTime() * 0.1) * 10; camera.lookAt(0, 15, 0); renderer.render(scene, camera);
          };
          animate();
      };
      const checkThree = () => { if (window.THREE) init3D(); else setTimeout(checkThree, 100); };
      if (!window.THREE) { if (!document.getElementById('three-js-script')) { const script = document.createElement('script'); script.id = 'three-js-script'; script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; document.head.appendChild(script); } checkThree(); } else { init3D(); }
      return () => { isMounted = false; if(frameId) cancelAnimationFrame(frameId); if(resizeListener) window.removeEventListener('resize', resizeListener); if(mountRef.current) mountRef.current.innerHTML = ''; };
    }, []);
  
    return (
      <div className="relative w-full h-[650px] md:h-[700px] rounded-xl overflow-hidden shadow-lg border-t-4 border-emerald-500 animate-fade-in">
        <div ref={mountRef} className="absolute inset-0 bg-black z-0"></div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-3 md:p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32">
          <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 shadow-2xl mb-3">
              <div className="flex items-center justify-between mb-2 text-emerald-700">
                  <div className="flex items-center"><span className="mr-2">🗺️</span><h2 className="text-base font-bold">บทที่ 5: จำลองเมืองในฝัน 3D</h2></div>
              </div>
              <p className="text-xs text-slate-700 mb-3">เลื่อนแถบด้านล่างเพื่อดูการเปลี่ยนแปลงของเมือง เมื่อมีพื้นที่สีเขียวเข้ามาแทรกซึม</p>
              <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>🏭 มลภาวะหนาแน่น</span><span className="text-emerald-600">🌳 เมืองในสวน</span></div>
                  <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
          </div>
          <button onClick={onComplete} className="max-w-lg mx-auto w-full bg-emerald-600/95 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl flex justify-center items-center transition-all shadow-md animate-bounce-short backdrop-blur-sm">
              พร้อมแล้ว เข้าสู่บทถัดไป ➡️
          </button>
        </div>
      </div>
    );
};

const Step6CarbonTax = ({ onComplete }) => {
  const [taxRate, setTaxRate] = useState(0); 
  const [feedback, setFeedback] = useState("");
  const [headlines, setHeadlines] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsFeedback, setNewsFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  const ecology = Math.min(100, 10 + (taxRate / 10)); 
  const economy = Math.max(10, 100 - (taxRate / 12)); 

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetchGeminiResponse(`ตั้งภาษีคาร์บอน ${taxRate} บาท/ตัน สิ่งแวดล้อม=${ecology.toFixed(0)}% เศรษฐกิจ=${economy.toFixed(0)}% ถกเถียงเรื่องความสมดุล โยงสิงคโปร์แก้ปัญหาโรงงานย้ายหนีอย่างไร?`, SYSTEM_PROMPT);
    setFeedback(res);

    const promptNews = `แต่งพาดหัวข่าวหน้าหนึ่ง 3 สำนักข่าว (A, B, C) ตอบรับการตั้งภาษีคาร์บอน ${taxRate} บาท/ตัน:
    สำนักข่าว A: สำนักข่าวของกลุ่มทุน (พาดหัวอ้างว่าบริษัทรักษ์โลกอยู่แล้ว ภาษีนี้ทำลายเศรษฐกิจ - เชิง Greenwashing)
    สำนักข่าว B: สำนักข่าวรัฐบาล (พาดหัวรายงานตัวเลขตามจริง เป็นกลาง)
    สำนักข่าว C: สำนักข่าวภาคประชาชน (พาดหัววิจารณ์ว่าภาษีน้อยไป ทุนใหญ่ยังฟอกเขียวได้)
    ห้ามอธิบายเพิ่ม พิมพ์ตอบตามโครงสร้างนี้เป๊ะๆ:
    A: [ข้อความพาดหัว]
    B: [ข้อความพาดหัว]
    C: [ข้อความพาดหัว]`;
    
    try {
        const newsRes = await fetchGeminiResponse(promptNews, "คุณคือนักบรรณาธิการข่าว");
        let parsed = [];
        const lines = newsRes.split('\n').map(l => l.trim());
        lines.forEach(line => {
          if(line.startsWith('A:')) parsed.push({id: 'A', text: line.substring(2).trim()});
          else if(line.startsWith('B:')) parsed.push({id: 'B', text: line.substring(2).trim()});
          else if(line.startsWith('C:')) parsed.push({id: 'C', text: line.substring(2).trim()});
        });
        if(parsed.length === 3) {
            setHeadlines(parsed);
        } else { throw new Error("Parsing failed"); }
    } catch (e) {
        setHeadlines([
           {id: 'A', text: `สภาอุตฯ โอด ภาษีคาร์บอน ${taxRate}บ. ทำลายขีดแข่งขัน ย้ำเอกชนไทยปลูกป่าทดแทน 100% แล้ว`},
           {id: 'B', text: `รัฐบาลเริ่มเก็บภาษีคาร์บอน ${taxRate} บาท/ตัน มีผลไตรมาสนี้`},
           {id: 'C', text: `NGO จวก ภาษีคาร์บอน ${taxRate}บ. ถูกเหมือนให้ฟรี เอื้อกลุ่มทุนฟอกเขียวปล่อยมลพิษต่อ`}
        ]);
    }
    setLoading(false);
  };

  const handleAnalyzeNews = async () => {
    setLoadingNews(true);
    const prompt = `นักเรียนเลือกพาดหัวข่าว ${selectedNews} ว่าเป็น 'ข่าวฟอกเขียว/เข้าข้างนายทุน' มากที่สุด จาก 3 ข่าวนี้:
    A: ${headlines.find(h=>h.id==='A')?.text}
    B: ${headlines.find(h=>h.id==='B')?.text}
    C: ${headlines.find(h=>h.id==='C')?.text}
    เฉลยแบบ Socratic: สำนักข่าว A คือข่าวทุนนิยม/ฟอกเขียว, B คือทางการ, C คือประชาชน ชมเชยถ้าตอบถูก (A) หรือชี้แนะถ้าตอบผิด โยงเรื่องการรู้เท่าทันสื่อ (Media Literacy) และ Greenwashing สั้นๆ 3 บรรทัด`;
    const res = await fetchGeminiResponse(prompt, SYSTEM_PROMPT);
    setNewsFeedback(res);
    setLoadingNews(false);
  };

  return (
    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
      <div className="flex items-center mb-4 text-purple-600"><span className="text-2xl mr-2">💰</span><h2 className="text-xl font-bold text-slate-800">บทที่ 6: เศรษฐศาสตร์คาร์บอน</h2></div>
      <p className="text-sm text-slate-600 mb-6">กำหนดอัตรา "ภาษีคาร์บอน" ที่เก็บจากโรงงานอุตสาหกรรม (บาท/ตันคาร์บอน)</p>
      <div className="mb-8 px-4"><input type="range" min="0" max="1000" step="50" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} disabled={feedback !== ""} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600" /><div className="text-center mt-3 font-bold text-xl text-purple-700">{taxRate} บาท / ตัน</div></div>
      <div className="flex justify-between items-center mb-8">
        <div className="w-1/2 pr-2 text-center"><div className={`text-4xl mx-auto mb-2 ${ecology > 50 ? 'opacity-100' : 'opacity-30 grayscale'}`}>🌿</div><p className="text-xs font-bold text-slate-500">ระบบนิเวศ</p><div className="w-full bg-slate-200 h-2 rounded-full mt-1"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${ecology}%` }}></div></div></div>
        <div className="w-1/2 pl-2 text-center"><div className={`text-4xl mx-auto mb-2 ${economy > 50 ? 'opacity-100' : 'opacity-30 grayscale'}`}>🏭</div><p className="text-xs font-bold text-slate-500">อุตสาหกรรม</p><div className="w-full bg-slate-200 h-2 rounded-full mt-1"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${economy}%` }}></div></div></div>
      </div>
      
      {!feedback ? (
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center">
          {loading ? "กำลังคำนวณผลกระทบเศรษฐกิจ..." : "ประกาศใช้ภาษี"}
        </button>
      ) : (
        <div className="space-y-6">
            <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 shadow-inner">
                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-indigo-700 flex items-center">💡 AI Socratic Feedback:</h3><TTSButton text={feedback} /></div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{feedback}</p>
            </div>

            {headlines.length > 0 && (
                <div className="bg-slate-800 p-5 md:p-6 rounded-xl shadow-md border-b-4 border-rose-500 text-white animate-fade-in">
                    <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">📰</span> 
                        <h3 className="font-bold text-lg">Spot the Spin: ถอดรหัสพาดหัวข่าว</h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-5">
                        นโยบายภาษีคาร์บอนของคุณเป็นข่าวดังแล้ว! แต่สื่อแต่ละสำนักมี "อคติ (Bias)" ไม่เหมือนกัน 
                        <strong>ลองวิเคราะห์ดูว่า สำนักข่าวไหนตั้งใจเขียนข่าวเพื่อ "ฟอกเขียว (Greenwashing)" เอื้อประโยชน์ให้นายทุนมากที่สุด?</strong>
                    </p>

                    <div className="space-y-3 mb-5">
                        {headlines.map(h => (
                            <button 
                                key={h.id}
                                onClick={() => setSelectedNews(h.id)}
                                disabled={newsFeedback !== ""}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                    selectedNews === h.id ? 'border-rose-500 bg-rose-900/50 scale-[1.02]' : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-600/50'
                                }`}
                            >
                                <div className="font-bold text-rose-300 text-xs mb-1 uppercase tracking-wider">สำนักข่าว {h.id}</div>
                                <div className="text-sm md:text-base leading-snug">"{h.text}"</div>
                            </button>
                        ))}
                    </div>

                    {!newsFeedback ? (
                        <button 
                            onClick={handleAnalyzeNews} 
                            disabled={!selectedNews || loadingNews} 
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center disabled:opacity-50 shadow-lg"
                        >
                            {loadingNews ? "กำลังตรวจสอบอคติของสื่อ..." : "ส่งคำตอบให้ AI ประเมิน"}
                        </button>
                    ) : (
                        <div className="bg-white text-slate-800 p-5 rounded-xl mt-2 animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-rose-600 text-sm flex items-center">✅ เฉลย: การรู้เท่าทันสื่อ (Media Literacy)</h4>
                                <TTSButton text={newsFeedback} />
                            </div>
                            <p className="whitespace-pre-line text-sm leading-relaxed">{newsFeedback}</p>
                        </div>
                    )}
                </div>
            )}

            {newsFeedback && (
                <button onClick={onComplete} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base font-bold py-4 rounded-xl flex justify-center items-center transition-all shadow-md animate-bounce-short">
                    เยี่ยมมาก! เข้าสู่บทสรุป Socratic Townhall ➡️
                </button>
            )}
        </div>
      )}
    </div>
  );
};

const Step7Townhall = ({ onComplete }) => {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'จากที่น้องได้ลองบริหารนโยบายต่างๆ น้องคิดว่า "อุปสรรคที่ใหญ่ที่สุด" ในการทำให้นโยบายสิ่งแวดล้อมเกิดได้จริงในไทยคืออะไรครับ? ลองพิมพ์มาให้พี่ฟังหน่อย' }]);
  const [input, setInput] = useState(''); const [loading, setLoading] = useState(false); const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text: userMsg }]); setLoading(true);
    const chatHistory = messages.map(m => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.text}`).join('\n');
    const res = await fetchGeminiResponse(`ประวัติ:\n${chatHistory}\nStudent: ${userMsg}\n\nตอบกลับชวนขยายประเด็นความเหลื่อมล้ำ โยงนโยบาย HDB ของสิงคโปร์`, SYSTEM_PROMPT);
    setMessages(prev => [...prev, { role: 'ai', text: res }]); setLoading(false);
  };

  return (
    <div className="animate-fade-in bg-white rounded-xl shadow-sm border-t-4 border-indigo-500 h-[650px] flex flex-col relative">
      <div className="p-4 border-b flex items-center justify-between text-indigo-700"><div className="flex items-center"><span className="text-2xl mr-2">💬</span><h2 className="text-lg font-bold">บทสรุป: Socratic Townhall</h2></div></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-24">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
              {m.role === 'ai' && (<div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2"><span className="font-bold text-xs text-indigo-500">AI Tutor</span><TTSButton text={m.text} /></div>)}
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (<div className="flex justify-start"><div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">AI กำลังวิเคราะห์...</div></div>)}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-white border-t absolute bottom-16 inset-x-0">
        <div className="flex space-x-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="พิมพ์แนวคิดของคุณ..." className="flex-1 border border-slate-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" disabled={loading} />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full w-12 h-12 flex justify-center items-center disabled:opacity-50 shadow-md">➡️</button>
        </div>
      </div>
      <button onClick={onComplete} className="absolute bottom-0 inset-x-0 w-full bg-slate-800 hover:bg-slate-900 text-white text-base font-bold py-4 flex justify-center items-center transition-all shadow-md z-20">
          จบการสนทนาและรับเกียรติบัตร 🎓 ➡️
      </button>
    </div>
  );
};

// --- NEW STEP 8: CERTIFICATE & REPORT ---
const Step8Certificate = () => {
    const [name, setName] = useState("");
    const [isGenerated, setIsGenerated] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const handleDownloadPDF = () => {
        setIsPrinting(true);
        const element = document.getElementById('certificate-print-area');
        
        const opt = {
            margin:       0.3,
            filename:     `Eco_Policy_Certificate_${name}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        const generatePdf = () => {
            window.html2pdf().set(opt).from(element).save().then(() => {
                setIsPrinting(false);
            }).catch(err => {
                console.error("PDF Generation Error:", err);
                setIsPrinting(false);
                alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
            });
        };

        if (window.html2pdf) {
            generatePdf();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = generatePdf;
            script.onerror = () => {
                setIsPrinting(false);
                alert("ไม่สามารถโหลดระบบสร้าง PDF ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
            };
            document.head.appendChild(script);
        }
    };

    if (!isGenerated) {
        return (
            <div className="animate-fade-in bg-white p-8 rounded-3xl shadow-xl border-t-8 border-yellow-500 text-center max-w-md mx-auto mt-10">
                <div className="text-7xl mx-auto mb-6">🏆</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">ยินดีด้วย! คุณผ่านการทดสอบแล้ว</h2>
                <p className="text-slate-600 mb-8 text-sm">กรุณากรอกชื่อ-นามสกุล เพื่อรับเกียรติบัตรและรายงานประเมินผลนโยบายสิ่งแวดล้อม</p>
                <input 
                    type="text" 
                    placeholder="นาย... / นางสาว..." 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 text-center focus:outline-none focus:border-yellow-500 font-bold text-slate-700"
                />
                <button 
                    onClick={() => setIsGenerated(true)}
                    disabled={!name.trim()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                    ✨ สร้างเกียรติบัตร (Generate Certificate)
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div id="certificate-print-area" className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl relative overflow-hidden border-8 border-slate-900 mx-auto max-w-2xl text-center print:shadow-none print:border-4 print:p-8">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                <div className="absolute -top-10 -left-10 text-[150px] opacity-10 pointer-events-none">🌐</div>
                <div className="absolute -bottom-10 -right-10 text-[150px] opacity-10 pointer-events-none">🌿</div>

                <div className="relative z-10">
                    <div className="text-6xl mx-auto mb-6 drop-shadow-md">🏆</div>
                    <h4 className="text-slate-500 font-bold tracking-widest uppercase text-sm mb-2">Certificate of Completion</h4>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-emerald-700 mb-8">
                        Socratic Eco-Policy Masterclass
                    </h1>
                    
                    <p className="text-slate-500 text-sm mb-2">ขอมอบประกาศนียบัตรนี้เพื่อแสดงว่า</p>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2 border-b-2 border-slate-200 inline-block px-10 pb-2">
                        {name}
                    </h2>
                    <p className="text-slate-600 text-sm mt-4 leading-relaxed max-w-md mx-auto">
                        ได้ผ่านหลักสูตรการจำลองนโยบายเมือง สิ่งแวดล้อม และความเหลื่อมล้ำทางสังคม พร้อมทั้งแสดงให้เห็นถึงทักษะ <strong className="text-indigo-600">การคิดเชิงวิพากษ์ (Critical Thinking)</strong> อันยอดเยี่ยม
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-4 text-left bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <div className="flex items-center"><span className="text-emerald-500 mr-2">✅</span><span className="text-xs text-slate-600 font-bold">วิศวกรรมการจัดการน้ำสำเร็จ</span></div>
                        <div className="flex items-center"><span className="text-emerald-500 mr-2">✅</span><span className="text-xs text-slate-600 font-bold">แก้ไขวิกฤต PM 2.5</span></div>
                        <div className="flex items-center"><span className="text-emerald-500 mr-2">✅</span><span className="text-xs text-slate-600 font-bold">บริหารผังเมืองสีเขียว</span></div>
                        <div className="flex items-center"><span className="text-emerald-500 mr-2">✅</span><span className="text-xs text-slate-600 font-bold">กำหนดภาษีคาร์บอน</span></div>
                    </div>

                    <div className="mt-10 flex justify-between items-end border-t border-slate-200 pt-6">
                        <div className="text-left">
                            <div className="font-bold text-indigo-900">AI Socratic Tutor</div>
                            <div className="text-[10px] text-slate-400">ผู้ประเมินผลและผู้ช่วยสอน</div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-emerald-700">🇹🇭 x 🇸🇬</div>
                            <div className="text-[10px] text-slate-400">Interactive Policy Lab</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4 print:hidden">
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isPrinting}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg flex items-center disabled:opacity-50"
                >
                    <span className="mr-2">{isPrinting ? "⏳" : "🖨️"}</span> 
                    {isPrinting ? "กำลังสร้างไฟล์ PDF..." : "ดาวน์โหลด PDF เกียรติบัตร"}
                </button>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-3 px-6 rounded-full transition-all shadow-sm flex items-center"
                >
                    <span className="mr-2">🔄</span> เริ่มต้นการทดลองใหม่
                </button>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    #certificate-print-area, #certificate-print-area * { visibility: visible; }
                    #certificate-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; border: none; box-shadow: none; }
                }
            `}} />
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [step, setStep] = useState(0);
  const totalSteps = 8;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-3xl mx-auto">
        
        {step > 0 && (
          <div className="mb-6 flex justify-between items-center animate-fade-in print:hidden">
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center text-slate-600 hover:text-indigo-600 transition-all font-bold text-sm bg-white py-2 px-5 rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:-translate-x-1"
            >
              <span className="mr-2">⬅️</span> ย้อนกลับ
            </button>
            {step < 8 && (
                <div className="text-xs font-bold text-slate-500 bg-white py-1.5 px-4 rounded-full shadow-sm border border-slate-200">
                  สเตป {step} / 7
                </div>
            )}
          </div>
        )}

        {step > 0 && step < 8 && (
          <div className="text-center mb-8 animate-fade-in print:hidden">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Eco-Policy Masterclass 🇹🇭 x 🇸🇬</h1>
            <p className="text-slate-500 text-sm">หลักสูตรจำลองนโยบายสิ่งแวดล้อม และ ความเหลื่อมล้ำทางสังคม</p>
            
            <div className="flex justify-center items-center mt-6 space-x-1 px-2">
              {Array.from({ length: 7 }, (_, i) => i + 1).map(num => (
                <React.Fragment key={num}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= num ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}>
                    {step > num ? "✅" : num}
                  </div>
                  {num < 7 && <div className={`flex-1 h-1 transition-all ${step > num ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Steps Rendering */}
        {step === 0 && <Step0Cover onStart={() => setStep(1)} onJump={(s) => setStep(s)} />}
        {step === 1 && <Step1WaterLab onComplete={() => setStep(2)} />}
        {step === 2 && <Step2PM25 onComplete={() => setStep(3)} />}
        {step === 3 && <Step3GreenSpace onComplete={() => setStep(4)} />}
        {step === 4 && <Step4FloodWall onComplete={() => setStep(5)} />}
        {step === 5 && <Step5CityInNature3D onComplete={() => setStep(6)} />}
        {step === 6 && <Step6CarbonTax onComplete={() => setStep(7)} />}
        {step === 7 && <Step7Townhall onComplete={() => setStep(8)} />}
        {step === 8 && <Step8Certificate />}

      </div>
    </div>
  );
}

