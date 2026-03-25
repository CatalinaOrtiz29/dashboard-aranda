// CONFIG
const EXCLUIR_GRUPOS = ["Gestión de Telefónia", "Desarrollo Web", "Admin. SAP", "Admin. Herramientas ITSM", "GESTOR CMDB", "Admin. CRM"];

// BASE DE DATOS
const mesesDB = {};
let mesActivo = '';

// DATOS INICIALES (PEGA TODO TU DATOS_MARZO AQUÍ)
const DATOS_MARZO = [/* PEGA TU JSON COMPLETO AQUÍ */];

// ESTADO GLOBAL
let TODOS    = [];
let filtered = [];
let page     = 1;
const PER_PAGE = 25;
let sortCol = 'pct', sortAsc = false;

// CHARTS
let chartAlerta, chartResp;