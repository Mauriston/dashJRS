
// =================================================================
// 1. API CONFIGURAÇÃO E ENDPOINTS (PARA O APP WEB REACT)
// =================================================================

const SHEET_ID = '12_X8hKR4T_ok33Tv-M8rwpKSUeJNwIAjo9rWzfoA2Nw';
const SHEET_NAME = 'ListaControle';
const REF_SHEET_NAME = 'ListasRef';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); 

  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const sheet = doc.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aba de dados não encontrada' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!e.postData && !e.parameter) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
    }

    let action = '';
    let data = null;

    if (e.postData) {
      const requestData = JSON.parse(e.postData.contents);
      action = requestData.action;
      data = requestData;
    } else {
      action = 'read';
    }

    let result = {};

    // --- READ ---
    if (action === 'read') {
      const rows = sheet.getDataRange().getDisplayValues();
      rows.shift(); // Remove Header
      
      const records = rows.map(row => ({
        id: row[0],
        isNumber: row[0],
        dataAbertura: row[1],
        dataEntrevista: row[2],
        horaEntrevista: row[3],
        finalidade: row[4],
        amp: row[5],
        medico: row[6],
        om: row[7],
        pgq: row[8],
        nip: row[9],
        inspecionado: row[10],
        statusIS: row[11],
        dataLaudo: row[12],
        laudo: row[13],
        observacoes: row[14],
        restricoes: row[15],
        tis: row[16],
        ds1a: row[17],
        msg: row[18]
      })).filter(r => r.id !== "");

      const lists = { finalidades: [], om: [], pg: [], status: [], msg: [], restricoes: [] };
      const sheetListas = doc.getSheetByName(REF_SHEET_NAME);
      if (sheetListas) {
          const listValues = sheetListas.getDataRange().getDisplayValues();
          listValues.shift();
          lists.finalidades = [...new Set(listValues.map(r => r[0]).filter(String))];
          lists.om = [...new Set(listValues.map(r => r[1]).filter(String))];
          lists.pg = [...new Set(listValues.map(r => r[2]).filter(String))];
          lists.status = [...new Set(listValues.map(r => r[5]).filter(String))];
          lists.msg = [...new Set(listValues.map(r => r[6]).filter(String))];
          lists.restricoes = [...new Set(listValues.map(r => r[7]).filter(String))];
      }
      result = { records: records, lists: lists };

    // --- CREATE ---
    } else if (action === 'create') {
      const r = data.record;
      sheet.appendRow([
        r.isNumber, r.dataAbertura, r.dataEntrevista, r.horaEntrevista, r.finalidade,
        r.amp, r.medico, r.om, r.pgq, r.nip, r.inspecionado, r.statusIS,
        r.dataLaudo, r.laudo, r.observacoes, r.restricoes, r.tis, r.ds1a, r.msg
      ]);
      
      // Tenta registrar novo militar se ele não existir
      registrarNovoMilitarNoBanco(r.om, r.pgq, r.nip, r.inspecionado, doc);

      result = { status: 'success', message: 'Registro criado.' };

    // --- UPDATE (FULL RECORD) ---
    } else if (action === 'update') {
      const r = data.record;
      const id = String(r.id || r.isNumber);
      
      const values = sheet.getDataRange().getDisplayValues();
      let rowIndex = -1;

      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex > 0) {
        const rowData = [[
            r.isNumber, r.dataAbertura, r.dataEntrevista, r.horaEntrevista, r.finalidade,
            r.amp, r.medico, r.om, r.pgq, r.nip, r.inspecionado, r.statusIS,
            r.dataLaudo, r.laudo, r.observacoes, r.restricoes, r.tis, r.ds1a, r.msg
        ]];
        
        const range = sheet.getRange(rowIndex, 1, 1, 19);
        range.setValues(rowData);
        
        if (String(r.msg).toUpperCase() === 'MSG ENVIADA') {
            range.setBackground(null);
        }
        
        // Também tenta registrar caso tenha sido uma edição que inseriu dados novos
        registrarNovoMilitarNoBanco(r.om, r.pgq, r.nip, r.inspecionado, doc);

        result = { status: 'success', message: 'Atualizado com sucesso.' };
      } else {
        result = { status: 'error', message: 'ID não encontrado.' };
      }

    // --- PATCH (PARTIAL UPDATE) ---
    } else if (action === 'patch') {
      const id = String(data.id);
      const updates = data.updates; // Ex: { msg: 'MSG ENVIADA' }
      
      const values = sheet.getDataRange().getDisplayValues();
      let rowIndex = -1;

      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex > 0) {
        // Mapeamento de campos para colunas
        if (updates.msg !== undefined) {
           sheet.getRange(rowIndex, COLUNAS.MSG).setValue(updates.msg);
           if (updates.msg === 'MSG ENVIADA') {
               sheet.getRange(rowIndex, 1, 1, 19).setBackground(null);
           }
        }
        if (updates.statusIS !== undefined) {
           sheet.getRange(rowIndex, COLUNAS.STATUS_IS).setValue(updates.statusIS);
        }
        
        result = { status: 'success', message: 'Atualização parcial realizada.' };
      } else {
        result = { status: 'error', message: 'ID não encontrado para patch.' };
      }

    // --- DELETE ---
    } else if (action === 'delete') {
      const id = String(data.id);
      const values = sheet.getDataRange().getDisplayValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          sheet.deleteRow(i + 1);
          result = { status: 'success', message: 'Deletado.' };
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

const SPREADSHEET_ID = SHEET_ID;
const SHEET_NAME_CONTROLE = SHEET_NAME;
const COLUNAS = {
  IS_ID: 1, DATA_ABERTURA: 2, DATA_ENTREVISTA: 3, HORA_ENTREVISTA: 4,
  FINALIDADE: 5, AMP: 6, MEDICO: 7, OM: 8, PGQ: 9, NIP: 10,
  INSPECIONADO: 11, STATUS_IS: 12, DATA_LAUDO: 13, LAUDO: 14,
  OBSERVACOES: 15, RESTRICOES: 16, TIS: 17, DS1A: 18, MSG: 19
};
const NOMES_ABAS = {
  PRINCIPAL: 'ListaControle',
  MILITARES_HNRE: 'MilitaresHNRe',
  MILITARES_OUTRAS: 'MilitaresOutrasOM',
  MEDICOS: 'AMPMedicos',
  FINALIDADES: 'FinalidadesAMP',
  LISTAS_REF: 'ListasRef'
};
const STATUS_NAMES = {
  ABERTA: 'IS aberta', AGENDADA: 'IS Agendada', REMARCADA: 'IS Remarcada',
  PENDENTE: 'Conclusão Pendente', CONCLUIDA: 'IS Concluída s/ voto',
  VOTADA: 'IS Votada s/ assinatura', ASSINADO: 'TIS assinado', CANCELADA: 'IS Cancelada'
};
const MSG_STATUS = { ENVIADA: 'MSG ENVIADA', PENDENTE: 'MSG PENDENTE', ATRASADA: 'MSG ATRASADA' };
const CORES = { ALERTA_VERMELHO: '#ea9999' };

function onEdit(e) {
  if (!e) return;
  var range = e.range;
  var aba = range.getSheet();
  if (aba.getName() != NOMES_ABAS.PRINCIPAL || range.getRow() <= 1) return;
  var col = range.getColumn();
  var val = String(e.value).trim();
  var linha = range.getRow();
  
  if (aba.getRange(linha, COLUNAS.DATA_ABERTURA).getValue() === "") {
    aba.getRange(linha, COLUNAS.DATA_ABERTURA).setValue(new Date());
    aba.getRange(linha, COLUNAS.STATUS_IS).setValue(STATUS_NAMES.ABERTA);
  }
  
  if (col == COLUNAS.FINALIDADE || col == COLUNAS.DATA_ENTREVISTA) {
    if (col == COLUNAS.FINALIDADE) aplicarLogicaFinalidade(aba, linha, val);
    var amp = aba.getRange(linha, COLUNAS.AMP).getValue();
    var dt = aba.getRange(linha, COLUNAS.DATA_ENTREVISTA).getValue();
    var diaIdx = (dt instanceof Date) ? dt.getDay() : -1;
    if (col == COLUNAS.DATA_ENTREVISTA && e.oldValue) aba.getRange(linha, COLUNAS.MEDICO).clearContent().setBackground(CORES.ALERTA_VERMELHO);
    if (amp) criarDropdownMedico(e.source, aba.getRange(linha, COLUNAS.MEDICO), amp, diaIdx);
  }

  if (col == COLUNAS.MEDICO && val != "" && val != "undefined") range.setBackground(null);

  if (col == COLUNAS.OM) {
    range.setBackground(null);
    var celulaInspecionado = aba.getRange(linha, COLUNAS.INSPECIONADO);
    celulaInspecionado.clearDataValidations();
    try {
      var listaNomes = [];
      if (val.toUpperCase() === "HNRE") {
        var abaMil = e.source.getSheetByName(NOMES_ABAS.MILITARES_HNRE);
        if (abaMil) listaNomes = abaMil.getRange(2, 3, abaMil.getLastRow()-1, 1).getValues().flat().filter(String);
      } else {
        var abaOutras = e.source.getSheetByName(NOMES_ABAS.MILITARES_OUTRAS);
        if (abaOutras) {
          var dados = abaOutras.getDataRange().getValues();
          listaNomes = dados.filter(row => String(row[0]).trim().toUpperCase() === val.toUpperCase()).map(row => row[3]).filter(String);
        }
      }
      if (listaNomes.length > 0) celulaInspecionado.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(listaNomes, true).build());
    } catch (err) { console.error("Erro dropdown OM: " + err); }
  }
  
  if (col == COLUNAS.INSPECIONADO) {
    var omNaLinha = aba.getRange(linha, COLUNAS.OM).getValue();
    aplicarLogicaMilitares(aba, linha, omNaLinha, val);
  }

  if (col == COLUNAS.PGQ) range.setBackground(null);
  
  if (col == COLUNAS.NIP && val !== "" && val !== "undefined") {
    var pgqAtual = aba.getRange(linha, COLUNAS.PGQ).getValue();
    var valorFormatado = formatarDocumento(val, pgqAtual);
    if (valorFormatado !== val) range.setValue(valorFormatado);
    range.setBackground(null);
    var r = aba.getRange(linha, 1, 1, 12).getValues()[0];
    registrarNovoMilitarNoBanco(r[COLUNAS.OM-1], r[COLUNAS.PGQ-1], valorFormatado, r[COLUNAS.INSPECIONADO-1], e.source);
  }

  if (col == COLUNAS.TIS && val !== "" && val !== "undefined") {
    var dataLaudo = aba.getRange(linha, COLUNAS.DATA_LAUDO).getValue();
    var tisFormatado = formatarTIS(val, dataLaudo);
    if (tisFormatado !== val) range.setValue(tisFormatado);
  }

  var colsStatus = [COLUNAS.DATA_ENTREVISTA, COLUNAS.LAUDO, COLUNAS.OBSERVACOES, COLUNAS.TIS, COLUNAS.DS1A];
  if (colsStatus.indexOf(col) > -1) recalcularStatusLinha(aba, linha, true, e.oldValue, {});
  if (col == COLUNAS.STATUS_IS && val != STATUS_NAMES.PENDENTE) aba.getRange(linha, 1, 1, 19).setBackground(null);
  if (col == COLUNAS.MSG && val == MSG_STATUS.ENVIADA) aba.getRange(linha, 1, 1, 19).setBackground(null);
}

function criarDropdownMedico(ss, celula, ampSelecionada, diaSemanaIndex) {
  try {
    var abaMedicos = ss.getSheetByName(NOMES_ABAS.MEDICOS);
    if (!abaMedicos) return;
    var dadosMedicos = abaMedicos.getDataRange().getValues();
    var listaFinal = [];
    var diasNomes = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    var diaProcurado = diaSemanaIndex >= 0 ? diasNomes[diaSemanaIndex] : null;
    for (var i = 1; i < dadosMedicos.length; i++) {
      var nomeMedico = String(dadosMedicos[i][0]).trim();
      var ampsDoMedico = String(dadosMedicos[i][1]).split(',').map(s => s.trim().toUpperCase());
      var diasDoMedico = String(dadosMedicos[i][2]).split(',').map(s => s.trim().toUpperCase());
      if (ampsDoMedico.indexOf(String(ampSelecionada).trim().toUpperCase()) > -1) {
        if (diaProcurado) {
          if (diasDoMedico.indexOf(diaProcurado.toUpperCase()) > -1) listaFinal.push(nomeMedico);
        } else { listaFinal.push(nomeMedico); }
      }
    }
    if (listaFinal.length > 0) {
      celula.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(listaFinal, true).build());
      if (listaFinal.length === 1) celula.setValue(listaFinal[0]).setBackground(null);
    } else { celula.clearDataValidations().setValue("s/ médico disponível p/ este dia/AMP"); }
  } catch (e) { console.error("Erro dropdown medico: " + e.toString()); }
}

function aplicarLogicaFinalidade(aba, linha, finalidade) {
  if (!finalidade) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaRef = ss.getSheetByName(NOMES_ABAS.FINALIDADES);
  if (!abaRef) return; 
  var dados = abaRef.getDataRange().getValues();
  var amp = "";
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim().toUpperCase() == String(finalidade).trim().toUpperCase()) {
      amp = dados[i][1]; break;
    }
  }
  if (amp) aba.getRange(linha, COLUNAS.AMP).setValue(amp);
}

function aplicarLogicaMilitares(aba, linha, om, nomeInspecionado) {
  if (!nomeInspecionado || !om) return;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var omUpper = String(om).trim().toUpperCase();
    var nomeUpper = String(nomeInspecionado).trim().toUpperCase();
    var pgqValue = "", nipValue = "", encontrado = false;

    if (omUpper === "HNRE") {
      var abaMil = ss.getSheetByName(NOMES_ABAS.MILITARES_HNRE);
      if (abaMil) {
        var dados = abaMil.getDataRange().getValues();
        for (var i = 1; i < dados.length; i++) {
          if (String(dados[i][2]).trim().toUpperCase() === nomeUpper) {
            pgqValue = dados[i][0]; nipValue = dados[i][1]; encontrado = true; break;
          }
        }
      }
    } else {
      var abaOutras = ss.getSheetByName(NOMES_ABAS.MILITARES_OUTRAS);
      if (abaOutras) {
        var dados = abaOutras.getDataRange().getValues();
        for (var i = 1; i < dados.length; i++) {
          if (String(dados[i][0]).trim().toUpperCase() === omUpper && String(dados[i][3]).trim().toUpperCase() === nomeUpper) {
            pgqValue = dados[i][1]; nipValue = dados[i][2]; encontrado = true; break;
          }
        }
      }
    }

    if (encontrado) {
      aba.getRange(linha, COLUNAS.PGQ).setValue(pgqValue).setBackground(null);
      aba.getRange(linha, COLUNAS.NIP).setValue(nipValue).setBackground(null);
    } else {
      aba.getRange(linha, COLUNAS.PGQ).setBackground(CORES.ALERTA_VERMELHO);
      aba.getRange(linha, COLUNAS.NIP).setBackground(CORES.ALERTA_VERMELHO);
    }
  } catch (e) { console.error("Erro lógica militares: " + e.toString()); }
}

function registrarNovoMilitarNoBanco(om, pgq, nip, nome, docSpreadsheet) {
  if (!om || !pgq || !nip || !nome) return;
  
  // Se docSpreadsheet não for passado (no caso de onEdit manual), tenta pegar o ativo
  var ss = docSpreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var omUpper = String(om).trim().toUpperCase();
  try {
    var mapaHierarquia = lerHierarquia(ss); 
    if (omUpper === "HNRE") {
      var aba = ss.getSheetByName(NOMES_ABAS.MILITARES_HNRE);
      if (!aba) return;
      var dados = [];
      if (aba.getLastRow() > 1) {
        dados = aba.getRange(2, 1, aba.getLastRow()-1, 5).getValues();
      }
      // Verifica duplicidade pelo NIP
      for (var i = 0; i < dados.length; i++) { 
          if (String(dados[i][1]).replace(/\D/g,'') == String(nip).replace(/\D/g,'')) return; 
      }
      
      dados.push([pgq, nip, nome, "", ""]);
      dados.sort(function(a, b) { return compararMilitares(a[0], a[1], a[2], b[0], b[1], b[2], mapaHierarquia); });
      
      // Reescreve a lista ordenada
      if (dados.length > 0) aba.getRange(2, 1, dados.length, 5).setValues(dados);
    } else {
      var aba = ss.getSheetByName(NOMES_ABAS.MILITARES_OUTRAS);
      if (!aba) return;
      var dados = [];
      if (aba.getLastRow() > 1) {
        dados = aba.getRange(2, 1, aba.getLastRow()-1, 4).getValues();
      }
      for (var i = 0; i < dados.length; i++) { 
          if (String(dados[i][0]).toUpperCase() == omUpper && String(dados[i][2]).replace(/\D/g,'') == String(nip).replace(/\D/g,'')) return; 
      }
      dados.push([om, pgq, nip, nome]);
      dados.sort(function(a, b) {
        var omCompare = String(a[0]).localeCompare(String(b[0]));
        if (omCompare !== 0) return omCompare;
        return compararMilitares(a[1], a[2], a[3], b[1], b[2], b[3], mapaHierarquia);
      });
      if (dados.length > 0) aba.getRange(2, 1, dados.length, 4).setValues(dados);
    }
  } catch (e) { console.error("Erro ao registrar e ordenar: " + e); }
}

function lerHierarquia(ss) {
  var mapa = {};
  var abaRef = ss.getSheetByName(NOMES_ABAS.LISTAS_REF);
  if (!abaRef) return mapa;
  var headers = abaRef.getRange(1, 1, 1, abaRef.getLastColumn()).getValues()[0];
  var colIndex = headers.indexOf("P/G");
  if (colIndex === -1) colIndex = 2; 
  var dados = abaRef.getRange(2, colIndex + 1, abaRef.getLastRow()-1, 1).getValues();
  for (var i = 0; i < dados.length; i++) {
    var val = String(dados[i][0]).trim().toUpperCase();
    if (val && mapa[val] === undefined) mapa[val] = i; 
  }
  return mapa;
}

function compararMilitares(pgqA, nipA, nomeA, pgqB, nipB, nomeB, mapa) {
  var patenteA = extrairPatente(pgqA);
  var patenteB = extrairPatente(pgqB);
  var pesoA = mapa[patenteA] !== undefined ? mapa[patenteA] : 999;
  var pesoB = mapa[patenteB] !== undefined ? mapa[patenteB] : 999;
  if (pesoA !== pesoB) return pesoA - pesoB; 
  var nonMilitary = ["SCNS", "DEPEND", "CANDIDATO", "CIVIL", "PENS"];
  var isCivilA = nonMilitary.some(t => patenteA.includes(t));
  var isCivilB = nonMilitary.some(t => patenteB.includes(t));
  if (!isCivilA && !isCivilB) return compararNIPs(nipA, nipB);
  else return String(nomeA).localeCompare(String(nomeB));
}

function extrairPatente(str) {
  if (!str) return "";
  var limpo = String(str).toUpperCase().split(/[\s\(\-]/)[0];
  return limpo.trim();
}

function compararNIPs(nipA, nipB) {
  var nA = String(nipA).replace(/\D/g, "");
  var nB = String(nipB).replace(/\D/g, "");
  if (nA.length < 2 || nB.length < 2) return nA.localeCompare(nB);
  var anoA = parseInt(nA.substring(0, 2), 10);
  var anoB = parseInt(nB.substring(0, 2), 10);
  var fullYearA = anoA > 50 ? 1900 + anoA : 2000 + anoA;
  var fullYearB = anoB > 50 ? 1900 + anoB : 2000 + anoB;
  if (fullYearA !== fullYearB) return fullYearA - fullYearB;
  var seqA = parseInt(nA.substring(2, 6) || "0", 10);
  var seqB = parseInt(nB.substring(2, 6) || "0", 10);
  return seqA - seqB; 
}

function formatarDocumento(valor, tipoPGQ) {
  var limpo = String(valor).replace(/\D/g, "");
  var tipo = String(tipoPGQ).toUpperCase();
  var isNonMilitary = ["SCNS", "DEPEND", "PENS", "CANDIDATO", "CIVIL"].some(t => tipo.includes(t));
  var isCandidato = tipo.includes("CANDIDATO");
  if (isCandidato && limpo.length === 7) return limpo.replace(/^(\d{6})(\d{1})$/, "$1-$2");
  if (isNonMilitary && limpo.length === 11) return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (limpo.length === 8) return limpo.replace(/^(\d{2})(\d{4})(\d{2})$/, "$1.$2.$3");
  return valor; 
}

function formatarTIS(valor, dataLaudo) {
  if (!valor) return valor;
  var valorStr = String(valor).trim();
  var anoStr = "000"; 
  if (dataLaudo instanceof Date) anoStr = dataLaudo.getFullYear().toString().slice(-3);
  else anoStr = new Date().getFullYear().toString().slice(-3);
  var regexCompleto = new RegExp("^" + anoStr + "\\.000\\.\\d+$");
  if (regexCompleto.test(valorStr)) return valorStr; 
  var sequencial = valorStr.replace(/\D/g, "");
  if (sequencial.length > 0) return anoStr + ".000." + sequencial;
  return valor;
}

function recalcularStatusLinha(aba, linha, isEdicao, oldDataEntrevista, formObject) {
  var valores = aba.getRange(linha, 1, 1, 19).getValues()[0];
  var vDataEnt = valores[COLUNAS.DATA_ENTREVISTA - 1];
  var vLaudo = String(valores[COLUNAS.LAUDO - 1]);
  var vObs = String(valores[COLUNAS.OBSERVACOES - 1]);
  var vTIS = String(valores[COLUNAS.TIS - 1]);
  var vDS1a = String(valores[COLUNAS.DS1A - 1]);
  var vDataLaudo = valores[COLUNAS.DATA_LAUDO - 1];
  var vStatusAtual = String(valores[COLUNAS.STATUS_IS - 1]);
  var novoStatus = "";
  if (vDS1a !== "" && vTIS !== "" && vLaudo !== "") novoStatus = STATUS_NAMES.ASSINADO;
  else if (vTIS !== "" && vLaudo !== "") novoStatus = STATUS_NAMES.VOTADA;
  else if (vLaudo !== "") novoStatus = STATUS_NAMES.CONCLUIDA;
  else if (vDataEnt !== "" && vDataEnt != null) {
    var isRemarcada = (isEdicao && oldDataEntrevista && new Date(vDataEnt).getTime() !== new Date(oldDataEntrevista).getTime());
    novoStatus = isRemarcada ? STATUS_NAMES.REMARCADA : (vObs !== "" ? STATUS_NAMES.PENDENTE : STATUS_NAMES.AGENDADA);
  } else novoStatus = STATUS_NAMES.ABERTA;
  if (novoStatus != vStatusAtual && novoStatus != "") aba.getRange(linha, COLUNAS.STATUS_IS).setValue(novoStatus);
  if (novoStatus == STATUS_NAMES.CONCLUIDA && vDataLaudo === "") aba.getRange(linha, COLUNAS.DATA_LAUDO).setValue(new Date());
  if (novoStatus == STATUS_NAMES.ASSINADO && aba.getRange(linha, COLUNAS.MSG).getValue() != MSG_STATUS.ENVIADA) aba.getRange(linha, COLUNAS.MSG).setValue(MSG_STATUS.PENDENTE);
}

function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => { if (t.getHandlerFunction() === 'verificarPrazosDiarios') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('verificarPrazosDiarios').timeBased().everyDays(1).atHour(6).create();
}

function verificarPrazosDiarios() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var aba = ss.getSheetByName(SHEET_NAME_CONTROLE);
  var valores = aba.getDataRange().getValues();
  var hoje = new Date();
  for (var i = 1; i < valores.length; i++) {
    var linha = i + 1;
    var vStatus = String(valores[i][COLUNAS.STATUS_IS - 1]);
    var vMsg = String(valores[i][COLUNAS.MSG - 1]);
    var vDtAb = valores[i][COLUNAS.DATA_ABERTURA - 1];
    var vDtEnt = valores[i][COLUNAS.DATA_ENTREVISTA - 1];
    var vDtLau = valores[i][COLUNAS.DATA_LAUDO - 1];
    if (vStatus == STATUS_NAMES.ABERTA && vDtAb instanceof Date && contarDiasUteis(vDtAb, hoje) > 7) {
      aba.getRange(linha, COLUNAS.STATUS_IS).setValue(STATUS_NAMES.CANCELADA);
      aba.getRange(linha, COLUNAS.MSG).setValue(MSG_STATUS.PENDENTE);
    }
    if (vStatus == STATUS_NAMES.PENDENTE && vDtEnt instanceof Date && contarDiasUteis(vDtEnt, hoje) > 20) aba.getRange(linha, 1, 1, 19).setBackground(CORES.ALERTA_VERMELHO);
    if (vMsg == MSG_STATUS.PENDENTE && vDtLau instanceof Date && contarDiasUteis(vDtLau, hoje) > 10) {
      aba.getRange(linha, COLUNAS.MSG).setValue(MSG_STATUS.ATRASADA);
      aba.getRange(linha, 1, 1, 19).setBackground(CORES.ALERTA_VERMELHO);
    }
  }
}

function contarDiasUteis(dataInicio, dataFim) {
  var inicio = new Date(dataInicio.getTime());
  var fim = new Date(dataFim.getTime());
  inicio.setHours(0,0,0,0); fim.setHours(0,0,0,0);
  if (inicio >= fim) return 0;
  var diasUteis = 0, cursor = new Date(inicio);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= fim) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) diasUteis++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return diasUteis;
}