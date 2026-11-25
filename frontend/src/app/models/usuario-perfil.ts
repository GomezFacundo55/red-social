export interface UsuarioPerfil {
  _id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  perfil: 'usuario' | 'administrador';
  imagenPerfil: string;
  descripcion: string;
  createdAt: string;
  correo?: string;
  fechaNacimiento?: string;
}
