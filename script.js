(function () {
  "use strict";

  /* ---------- Utilidades ---------- */

  // Renderiza LaTeX con KaTeX; si no cargó, muestra el texto tal cual.
  function tex(el, latex, display) {
    if (window.katex) {
      try {
        window.katex.render(latex, el, { displayMode: !!display, throwOnError: false });
        return;
      } catch (e) { /* cae al texto plano */ }
    }
    el.textContent = latex;
  }

  function fact(n) {
    var r = 1n;
    for (var i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  }

  function esEntero(txt) { return /^\d+$/.test(String(txt).trim()); }

  var MAX_N = 1000; // límite razonable para el cálculo

  /* ---------- Cálculo ---------- */

  // Devuelve { ok:true, valor:BigInt, latex:string } o { ok:false, error:string }
  function calcular(op, nTxt, rTxt) {
    nTxt = String(nTxt == null ? "" : nTxt).trim();
    rTxt = String(rTxt == null ? "" : rTxt).trim();

    if (op === "permRep") {
      if (rTxt === "") return { ok: false, error: "Escribe los grupos, por ejemplo 1,4,4,2." };
      var partes = rTxt.split(",").map(function (s) { return s.trim(); });
      if (!partes.every(esEntero)) return { ok: false, error: "Los grupos deben ser enteros no negativos separados por coma." };
      var g = partes.map(Number);
      var total = g.reduce(function (a, b) { return a + b; }, 0);
      if (total > MAX_N) return { ok: false, error: "El total es demasiado grande (máximo " + MAX_N + ")." };
      var den = 1n;
      g.forEach(function (x) { den *= fact(x); });
      var val = fact(total) / den;
      var denTex = g.map(function (x) { return x + "!"; }).join(" \\cdot ");
      return {
        ok: true,
        valor: val,
        latex: "\\frac{" + total + "!}{" + denTex + "} = " + val.toString()
      };
    }

    if (!esEntero(nTxt)) return { ok: false, error: "n debe ser un entero mayor o igual que 0." };
    var n = Number(nTxt);
    if (n > MAX_N) return { ok: false, error: "n es demasiado grande (máximo " + MAX_N + ")." };

    if (op === "factorial") {
      var f = fact(n);
      return { ok: true, valor: f, latex: "P_{" + n + "} = " + n + "! = " + f.toString() };
    }

    if (op === "permCirc") {
      if (n < 1) return { ok: false, error: "La permutación circular requiere n ≥ 1." };
      var c = fact(n - 1);
      return { ok: true, valor: c, latex: "PC(" + n + ") = (" + n + "-1)! = " + (n - 1) + "! = " + c.toString() };
    }

    if (op === "permSin") {
      var r;
      if (rTxt === "") r = n;
      else if (!esEntero(rTxt)) return { ok: false, error: "r debe ser un entero mayor o igual que 0." };
      else r = Number(rTxt);
      if (r > n) return { ok: false, error: "r no puede ser mayor que n." };
      var p = fact(n) / fact(n - r);
      return {
        ok: true,
        valor: p,
        latex: "P(" + n + "," + r + ") = \\frac{" + n + "!}{(" + n + "-" + r + ")!} = \\frac{" + n + "!}{" + (n - r) + "!} = " + p.toString()
      };
    }

    return { ok: false, error: "Operación no válida." };
  }

  /* ---------- Calculadora ---------- */

  var FORMULAS = {
    factorial: "P_n = n!",
    permSin: "P(n,r) = \\dfrac{n!}{(n-r)!}",
    permCirc: "PC(n) = (n-1)!",
    permRep: "P_n^{n_1,n_2,\\ldots,n_k} = \\dfrac{n!}{n_1!\\cdot n_2!\\cdots n_k!}"
  };

  var $op = document.getElementById("operacion");
  var $n = document.getElementById("n");
  var $r = document.getElementById("r");
  var $grupos = document.getElementById("grupos");
  var $res = document.getElementById("resultado");

  function actualizarCampos() {
    var op = $op.value;
    tex(document.getElementById("formula-op"), FORMULAS[op], true);
    document.getElementById("caja-n").classList.toggle("hidden", op === "permRep");
    document.getElementById("caja-r").classList.toggle("hidden", op !== "permSin");
    document.getElementById("caja-grupos").classList.toggle("hidden", op !== "permRep");
    document.getElementById("campos-nr").classList.toggle("hidden", op === "permRep");
    actualizarResultado();
  }

  // Se recalcula en tiempo real con cada cambio.
  function actualizarResultado() {
    var op = $op.value;
    var vacio = op === "permRep" ? $grupos.value.trim() === "" : $n.value.trim() === "";
    if (vacio) {
      $res.className = "hidden";
      $res.innerHTML = "";
      return;
    }
    var res = calcular(op, $n.value, op === "permRep" ? $grupos.value : $r.value);
    $res.className = res.ok ? "ok" : "error";
    $res.innerHTML = "";
    if (res.ok) {
      var f = document.createElement("div");
      $res.appendChild(f);
      tex(f, res.latex, true);
    } else {
      $res.textContent = res.error;
    }
  }

  $op.addEventListener("change", actualizarCampos);
  [$n, $r, $grupos].forEach(function (el) {
    el.addEventListener("input", actualizarResultado);
  });
  actualizarCampos();

  /* ---------- Casos de prueba ---------- */

  var $tbody = document.querySelector("#tabla-pruebas tbody");

  function opcionesOp(sel) {
    var items = [
      ["factorial", "n!"],
      ["permSin", "P(n, r)"],
      ["permCirc", "(n-1)! circular"],
      ["permRep", "Con repetición"]
    ];
    return items.map(function (it) {
      return '<option value="' + it[0] + '"' + (it[0] === sel ? " selected" : "") + ">" + it[1] + "</option>";
    }).join("");
  }

  function agregarFila(d) {
    d = d || { op: "permSin", n: "", r: "", e: "" };
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><select class="t-op">' + opcionesOp(d.op) + "</select></td>" +
      '<td><input class="t-n" type="text" inputmode="numeric" value="' + d.n + '"></td>' +
      '<td><input class="t-r" type="text" value="' + d.r + '"></td>' +
      '<td><input class="t-e" type="text" value="' + d.e + '"></td>' +
      '<td class="t-o">-</td><td class="t-s">-</td>' +
      '<td><button type="button" class="quitar" title="Quitar caso">X</button></td>';
    tr.querySelector(".quitar").addEventListener("click", function () {
      tr.remove();
      ejecutarPruebas();
    });
    $tbody.appendChild(tr);
  }

  function normalizar(s) { return String(s).replace(/[\s,]/g, "").toUpperCase(); }

  function ejecutarPruebas() {
    var filas = $tbody.querySelectorAll("tr");
    var pasan = 0, total = 0;
    filas.forEach(function (tr) {
      var op = tr.querySelector(".t-op").value;
      var n = tr.querySelector(".t-n").value;
      var r = tr.querySelector(".t-r").value;
      var e = tr.querySelector(".t-e").value;
      var $o = tr.querySelector(".t-o");
      var $s = tr.querySelector(".t-s");

      if (e.trim() === "" && n.trim() === "" && r.trim() === "") {
        $o.textContent = "-"; $s.textContent = "-"; $s.className = "t-s";
        return;
      }

      var res = calcular(op, n, r);
      var obtenido = res.ok ? res.valor.toString() : "ERROR";
      $o.textContent = obtenido;

      var ok = normalizar(obtenido) === normalizar(e);
      total++;
      if (ok) pasan++;
      $s.textContent = ok ? "Pasa" : "Falla";
      $s.className = "t-s " + (ok ? "pasa" : "falla");
    });
    document.getElementById("resumen-pruebas").textContent =
      total ? ("Resultado: " + pasan + " de " + total + " pruebas pasan.") : "No hay casos con datos.";
  }

  // Las pruebas se ejecutan solas al editar cualquier campo de la tabla.
  $tbody.addEventListener("input", ejecutarPruebas);
  $tbody.addEventListener("change", ejecutarPruebas);
  document.getElementById("btn-agregar").addEventListener("click", function () {
    agregarFila();
    ejecutarPruebas();
  });

  // Casos de ejemplo (puedes editarlos o borrarlos)
  agregarFila({ op: "factorial", n: "5", r: "", e: "120" });
  agregarFila({ op: "permSin", n: "5", r: "3", e: "60" });
  agregarFila({ op: "permCirc", n: "6", r: "", e: "120" });
  agregarFila({ op: "permRep", n: "", r: "1,4,4,2", e: "34650" });
  agregarFila({ op: "permSin", n: "3", r: "5", e: "ERROR" });
  ejecutarPruebas();
})();
