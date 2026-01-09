
import { NextResponse } from 'next/server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let ThermalPrinter: any;
let PrinterTypes: any;
try {
  const mod = require('node-thermal-printer');
  ThermalPrinter = mod.printer;
  PrinterTypes = mod.types;
} catch (e) {
  // Module not installed; will handle below
}

export async function POST(request: Request) {
  try {
    if (!ThermalPrinter || !PrinterTypes) {
      return NextResponse.json(
        { message: 'Printing module not installed', hint: 'Install node-thermal-printer' },
        { status: 501 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      companyRnc,
      companyPhone,
      companyAddress,
      logoPath,
      loanNumber,
      clientName,
      clientEmail,
      paymentDate,
      amountPaid,
      principalApplied,
      changeReturned,
      totalPending,
      cashier,
    } = body || {};

    const iface = process.env.PRINTER_INTERFACE;
    if (!iface) {
      return NextResponse.json(
        { message: 'PRINTER_INTERFACE is not configured' },
        { status: 400 }
      );
    }

    const printer = new (ThermalPrinter as any)({
      type: (PrinterTypes as any).EPSON,
      interface: iface,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      width: 42,
      lineCharacter: '-',
    });

    const connected = await printer.isPrinterConnected().catch(() => false);
    if (!connected) {
      return NextResponse.json(
        { message: 'Printer is not reachable', interface: iface },
        { status: 502 }
      );
    }

    printer.alignCenter();
    try {
      const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
      const resolvedLogo = logoPath
        ? path.resolve(root, logoPath)
        : path.resolve(process.cwd(), 'public', 'logo.png');
      await printer.printImage(resolvedLogo);
    } catch {}

    printer.bold(true);
    printer.println(companyName || 'RECIBO DE PAGO');
    printer.bold(false);
    if (companyRnc) printer.println(`RNC: ${companyRnc}`);
    if (companyPhone) printer.println(`Tel: ${companyPhone}`);
    if (companyAddress) printer.println(companyAddress);
    printer.drawLine();

    printer.alignLeft();
    if (loanNumber) printer.println(`Préstamo: ${loanNumber}`);
    if (clientName) printer.println(`Cliente: ${clientName}`);
    if (clientEmail) printer.println(`Email: ${clientEmail}`);
    if (cashier) printer.println(`Cajero: ${cashier}`);
    if (paymentDate) printer.println(`Fecha: ${paymentDate}`);

    printer.drawLine();
    printer.tableCustom([
      { text: 'Concepto', align: 'LEFT', width: 0.5 },
      { text: 'Monto', align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Pago recibido', align: 'LEFT', width: 0.5 },
      { text: `$${Number(amountPaid ?? 0).toFixed(2)}`, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Aplicado a capital', align: 'LEFT', width: 0.5 },
      { text: `$${Number(principalApplied ?? 0).toFixed(2)}`, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Cambio', align: 'LEFT', width: 0.5 },
      { text: `$${Number(changeReturned ?? 0).toFixed(2)}`, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Saldo pendiente', align: 'LEFT', width: 0.5 },
      { text: `$${Number(totalPending ?? 0).toFixed(2)}`, align: 'RIGHT', width: 0.5 },
    ]);

    printer.drawLine();
    printer.alignCenter();
    printer.println('¡Gracias por su pago!');
    printer.cut();

    await printer.execute();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error printing payment receipt', error: String(error) },
      { status: 500 }
    );
  }
}

