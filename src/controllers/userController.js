import User from "../models/userModel.js";

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un usuario específico
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const errors = User.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = User.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await User.update(id, req.body);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.delete(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías de un usuario
const getUserMemberships = async (req, res) => {
  try {
    const { id } = req.params;
    const memberships = await User.getMemberships(id);
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserMemberships,
};
