export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Erro nao tratado:", error);

  if (error?.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Banco de dados indisponivel no momento"
    });
  }

  return res.status(500).json({
    error: "Erro interno do servidor"
  });
}
