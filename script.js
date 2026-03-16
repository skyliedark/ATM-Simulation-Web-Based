const DB = {
  accounts: {
    "1234": { pin: "5678", name: "ALEX MORGAN", balance: 4820.50, savings: 12340.00, history: [
      { type: "DEPOSIT", amount: 500, date: "2026-03-10", bal: 4820.50 },
      { type: "WITHDRAWAL", amount: 200, date: "2026-03-08", bal: 4320.50 },
      { type: "DEPOSIT", amount: 1000, date: "2026-03-01", bal: 4520.50 },
    ]},
    "9999": { pin: "1111", name: "ROSE JEAN", balance: 2150.75, savings: 5600.00, history: [] }
  }
};

let state = {
  view: 'welcome', cardNum: '', pin: '', account: null,
  pinAttempts: 0, inputBuffer: '', message: null, transferAmt: 0,
};

function render() {
  const s = document.getElementById('screen');
  const k = document.getElementById('keypad');
  s.innerHTML = ''; k.innerHTML = '';
  s.className = 'screen-content fade-in';
  const views = {
    welcome: renderWelcome, insertCard: renderInsertCard, pin: renderPin,
    menu: renderMenu, balance: renderBalance, withdraw: renderWithdraw,
    deposit: renderDeposit, history: renderHistory, confirm: renderConfirm,
    receipt: renderReceipt, locked: renderLocked,
  };
  (views[state.view] || renderWelcome)(s, k);
}

function msg(text, type='info') {
  return `<div class="message-box ${type}">${text}</div>`;
}
function title(t) {
  return `<div class="screen-title">${t}</div>`;
}
function fmtMoney(n) {
  return '₱' + Number(n).toLocaleString('en-PH', {minimumFractionDigits:2,maximumFractionDigits:2});
}
function mkBtn(label, cls, fn) {
  const b = document.createElement('button');
  b.className = `btn ${cls}`; b.textContent = label; b.onclick = fn;
  return b;
}
function numKeypad(onKey, onClear, onEnter) {
  const k = document.getElementById('keypad');
  [['1','2','3'],['4','5','6'],['7','8','9']].forEach(r => {
    const row = document.createElement('div'); row.className = 'keypad-row';
    r.forEach(n => row.appendChild(mkBtn(n, 'num', () => onKey(n))));
    k.appendChild(row);
  });
  const lastRow = document.createElement('div'); lastRow.className = 'keypad-row';
  lastRow.appendChild(mkBtn('CLR', 'action-red', onClear));
  lastRow.appendChild(mkBtn('0', 'num', () => onKey('0')));
  lastRow.appendChild(mkBtn('ENT', 'action-green', onEnter));
  k.appendChild(lastRow);
}
function backBtn() {
  const k2 = document.getElementById('keypad');
  const r = document.createElement('div'); r.className='keypad-row';
  r.appendChild(mkBtn('◀ BACK', 'action-amber wide', () => { state.view='menu'; state.message=null; render(); }));
  k2.appendChild(r);
}
function go(view) { state.view = view; state.inputBuffer=''; state.message=null; render(); }
function logout() { state = {view:'welcome',cardNum:'',pin:'',account:null,pinAttempts:0,inputBuffer:'',message:null,transferAmt:0}; render(); }
function quickAmt(a) { state.inputBuffer = String(a); render(); }

function renderWelcome(s) {
  s.innerHTML = `<div class="welcome-view">
    <div class="big-text">NEXUSBANK</div>
    <div class="sub">AUTOMATED TELLER MACHINE</div>
    <div style="color:var(--muted);font-size:11px;line-height:1.8;">
      ▸ Withdrawals &amp; Deposits<br>▸ Balance Inquiries<br>▸ Account Transfers<br>▸ Transaction History
    </div></div>`;
  const k2 = document.getElementById('keypad');
  const row = document.createElement('div'); row.className='keypad-row';
  row.appendChild(mkBtn('[ INSERT CARD ]', 'action-green wide', () => { state.view='insertCard'; render(); }));
  k2.appendChild(row);
}

function renderInsertCard(s) {
  s.innerHTML = `${title('CARD NUMBER')}
    ${state.message ? msg(state.message.text, state.message.type) : ''}
    <div class="input-group">
      <label class="input-label">ENTER 4-DIGIT CARD NUMBER</label>
      <input class="atm-input" id="cardInput" type="text" maxlength="4" placeholder="_ _ _ _" autocomplete="off" inputmode="numeric">
    </div>`;
  state.message = null;
  document.getElementById('cardInput').addEventListener('input', e => {
    state.cardNum = e.target.value.replace(/\D/g,'').slice(0,4);
    e.target.value = state.cardNum;
  });
  numKeypad(
    n => { if(state.cardNum.length<4){state.cardNum+=n;document.getElementById('cardInput').value=state.cardNum;} },
    () => { state.cardNum='';document.getElementById('cardInput').value=''; },
    () => {
      if(DB.accounts[state.cardNum]){state.account=state.cardNum;state.pin='';state.pinAttempts=0;state.view='pin';}
      else{state.message={text:'Card not recognized. Try 1234 or 9999.',type:'error'};state.cardNum='';}
      render();
    }
  );
  const k2=document.getElementById('keypad');
  const row=document.createElement('div');row.className='keypad-row';
  row.appendChild(mkBtn('◀ CANCEL','action-amber',()=>{state.view='welcome';state.cardNum='';render();}));
  k2.insertBefore(row,k2.lastChild);
}

function renderPin(s) {
  s.innerHTML = `${title('ENTER PIN')}
    ${state.message ? msg(state.message.text, state.message.type) : ''}
    <div class="input-group">
      <label class="input-label">4-DIGIT PIN — CARD: **** ${state.account}</label>
      <input class="atm-input" id="pinInput" type="password" maxlength="4" placeholder="_ _ _ _" autocomplete="off" inputmode="numeric" readonly>
    </div>
    <div style="font-size:10px;color:var(--muted);margin-top:8px;">Attempts remaining: ${3-state.pinAttempts}</div>`;
  state.message = null;
  numKeypad(
    n => { if(state.pin.length<4){state.pin+=n;document.getElementById('pinInput').value='●'.repeat(state.pin.length);} },
    () => { state.pin='';document.getElementById('pinInput').value=''; },
    () => {
      const acct=DB.accounts[state.account];
      if(state.pin===acct.pin){state.view='menu';state.pin='';}
      else{state.pinAttempts++;state.pin='';if(state.pinAttempts>=3){state.view='locked';}else{state.message={text:`Incorrect PIN. ${3-state.pinAttempts} attempt(s) left.`,type:'error'};}}
      render();
    }
  );
  const k2=document.getElementById('keypad');
  const row=document.createElement('div');row.className='keypad-row';
  row.appendChild(mkBtn('◀ BACK','action-amber',()=>{state.view='insertCard';state.pin='';render();}));
  k2.insertBefore(row,k2.lastChild);
}

function renderMenu(s) {
  const acct=DB.accounts[state.account];
  s.innerHTML = `${title('MAIN MENU')}
    <div style="font-size:11px;color:var(--green-dim);margin-bottom:12px;">WELCOME, ${acct.name}</div>
    <div class="menu-grid">
      <button class="menu-btn" onclick="go('balance')"><span class="icon">💳</span>BALANCE</button>
      <button class="menu-btn" onclick="go('withdraw')"><span class="icon">💸</span>WITHDRAW</button>
      <button class="menu-btn" onclick="go('deposit')"><span class="icon">📥</span>DEPOSIT</button>
      <button class="menu-btn" onclick="go('history')"><span class="icon">📋</span>HISTORY</button>
    </div>`;
  const k2=document.getElementById('keypad');
  const row=document.createElement('div');row.className='keypad-row';
  row.appendChild(mkBtn('🔒 LOG OUT','action-red wide',logout));
  k2.appendChild(row);
}

function renderBalance(s) {
  const acct=DB.accounts[state.account];
  s.innerHTML = `${title('ACCOUNT BALANCE')}
    <div class="balance-display">
      <div class="balance-label">CHECKING ACCOUNT</div>
      <div class="balance-amount"><span class="currency">₱</span>${Number(acct.balance).toLocaleString('en-PH',{minimumFractionDigits:2})}</div>
      <div class="account-info">Card ending in ${state.account.slice(-4)} ● ${acct.name}</div>
    </div>
    <div class="balance-display">
      <div class="balance-label">SAVINGS ACCOUNT</div>
      <div class="balance-amount" style="font-size:20px;"><span class="currency">₱</span>${Number(acct.savings).toLocaleString('en-PH',{minimumFractionDigits:2})}</div>
    </div>`;
  backBtn();
}

function renderWithdraw(s) {
  const acct=DB.accounts[state.account];
  state.inputBuffer=state.inputBuffer||'';
  s.innerHTML = `${title('WITHDRAWAL')}
    ${state.message?msg(state.message.text,state.message.type):''}
    <div class="input-group">
      <label class="input-label">AMOUNT TO WITHDRAW</label>
      <input class="atm-input" id="amtInput" type="text" placeholder="0.00" value="${state.inputBuffer}" readonly>
    </div>
    <div style="font-size:10px;color:var(--muted);">Available: ${fmtMoney(acct.balance)}</div>
    <div class="keypad-row" style="gap:6px;margin-top:10px;flex-wrap:wrap;">
      ${[500,1000,2000,5000].map(a=>`<button class="btn action-amber" style="font-size:11px;flex:1;min-width:60px;" onclick="quickAmt(${a})">₱${a}</button>`).join('')}
    </div>`;
  state.message=null;
  numKeypad(
    n=>{state.inputBuffer+=n;document.getElementById('amtInput').value=state.inputBuffer;},
    ()=>{state.inputBuffer=state.inputBuffer.slice(0,-1);document.getElementById('amtInput').value=state.inputBuffer;},
    ()=>{
      const amt=parseFloat(state.inputBuffer);
      if(!amt||amt<=0){state.message={text:'Enter a valid amount.',type:'error'};}
      else if(amt>acct.balance){state.message={text:'Insufficient funds.',type:'error'};}
      else if(amt%100!==0){state.message={text:'Amount must be multiple of ₱100.',type:'error'};}
      else{state.transferAmt=amt;state.view='confirm';state.confirmAction='withdraw';}
      state.inputBuffer='';render();
    }
  );
  backBtn();
}

function renderDeposit(s) {
  state.inputBuffer=state.inputBuffer||'';
  s.innerHTML = `${title('DEPOSIT')}
    ${state.message?msg(state.message.text,state.message.type):''}
    <div class="input-group">
      <label class="input-label">AMOUNT TO DEPOSIT</label>
      <input class="atm-input" id="amtInput" type="text" placeholder="0.00" value="${state.inputBuffer}" readonly>
    </div>
    <div style="font-size:10px;color:var(--muted);margin-top:6px;">Insert cash into the cash slot</div>`;
  state.message=null;
  numKeypad(
    n=>{state.inputBuffer+=n;document.getElementById('amtInput').value=state.inputBuffer;},
    ()=>{state.inputBuffer=state.inputBuffer.slice(0,-1);document.getElementById('amtInput').value=state.inputBuffer;},
    ()=>{
      const amt=parseFloat(state.inputBuffer);
      if(!amt||amt<=0){state.message={text:'Enter a valid amount.',type:'error'};}
      else{state.transferAmt=amt;state.view='confirm';state.confirmAction='deposit';}
      state.inputBuffer='';render();
    }
  );
  backBtn();
}

function renderConfirm(s) {
  s.innerHTML = `${title('CONFIRM TRANSACTION')}
    ${msg(`You are about to ${state.confirmAction.toUpperCase()} ${fmtMoney(state.transferAmt)}. Confirm?`,'info')}
    <div style="font-size:11px;color:var(--muted);">This transaction cannot be reversed.</div>`;
  const k2=document.getElementById('keypad');
  const r1=document.createElement('div');r1.className='keypad-row';
  r1.appendChild(mkBtn('✓ CONFIRM','action-green wide',()=>{
    const acct=DB.accounts[state.account];
    const now=new Date().toISOString().slice(0,10);
    if(state.confirmAction==='withdraw'){acct.balance-=state.transferAmt;acct.history.unshift({type:'WITHDRAWAL',amount:state.transferAmt,date:now,bal:acct.balance});}
    else{acct.balance+=state.transferAmt;acct.history.unshift({type:'DEPOSIT',amount:state.transferAmt,date:now,bal:acct.balance});}
    state.view='receipt';render();
  }));
  k2.appendChild(r1);
  const r2=document.createElement('div');r2.className='keypad-row';
  r2.appendChild(mkBtn('✕ CANCEL','action-red wide',()=>{state.view='menu';render();}));
  k2.appendChild(r2);
}

function renderReceipt(s) {
  const acct=DB.accounts[state.account];
  const tx=acct.history[0];
  const isDebit=tx.type==='WITHDRAWAL';
  s.innerHTML = `${title('TRANSACTION COMPLETE')}
    ${msg('✓ Transaction successful!','success')}
    <div style="font-size:11px;line-height:2;color:var(--muted);">
      TYPE: <span style="color:var(--text)">${tx.type}</span><br>
      AMOUNT: <span style="${isDebit?'color:var(--red)':'color:var(--green)'}">${isDebit?'-':'+'} ${fmtMoney(tx.amount)}</span><br>
      NEW BALANCE: <span style="color:var(--green)">${fmtMoney(tx.bal)}</span><br>
      DATE: <span style="color:var(--text)">${tx.date}</span>
    </div>`;
  const k2=document.getElementById('keypad');
  const r1=document.createElement('div');r1.className='keypad-row';
  r1.appendChild(mkBtn('MENU','action-green',()=>{state.view='menu';render();}));
  r1.appendChild(mkBtn('LOGOUT','action-red',logout));
  k2.appendChild(r1);
}

function renderHistory(s) {
  const acct=DB.accounts[state.account];
  const rows=acct.history.length
    ?acct.history.map(tx=>{const d=tx.type==='WITHDRAWAL';return`<div class="tx-item"><span class="tx-type">${tx.type}</span><span class="tx-amount ${d?'debit':'credit'}">${d?'- ':'+ '}${fmtMoney(tx.amount)}</span><span class="tx-date">${tx.date}</span></div>`;}).join('')
    :'<div class="tx-empty">No transactions found</div>';
  s.innerHTML = `${title('TRANSACTION HISTORY')}<div class="transaction-history">${rows}</div>`;
  backBtn();
}

function renderLocked(s) {
  s.innerHTML = `${title('ACCOUNT LOCKED')}${msg('⚠ Too many incorrect PIN attempts. Card has been locked. Please contact your bank.','error')}`;
  const k2=document.getElementById('keypad');
  const r=document.createElement('div');r.className='keypad-row';
  r.appendChild(mkBtn('◀ EXIT','action-amber wide',()=>{state={view:'welcome',cardNum:'',pin:'',account:null,pinAttempts:0,inputBuffer:'',message:null,transferAmt:0};render();}));
  k2.appendChild(r);
}

render();