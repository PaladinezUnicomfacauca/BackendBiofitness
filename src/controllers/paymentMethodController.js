import PaymentMethod from "../models/paymentMethodModel.js";

// Obtener todos los métodos de pago
const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.findAll();
    res.json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un método de pago específico
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.findById(id);

    if (!method) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nuevo método de pago
const createPaymentMethod = async (req, res) => {
  try {
    const errors = PaymentMethod.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const method = await PaymentMethod.create(req.body);
    res.status(201).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar método de pago
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = PaymentMethod.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const method = await PaymentMethod.update(id, req.body);
    if (!method) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar método de pago
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.delete(id);

    if (!method) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json({ message: "Método de pago eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías de un método de pago
const getPaymentMethodMemberships = async (req, res) => {
  try {
    const { id } = req.params;
    const memberships = await PaymentMethod.getMemberships(id);
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodMemberships,
};
