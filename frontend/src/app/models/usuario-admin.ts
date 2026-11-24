export interface UsuarioAdmin {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  perfil: 'usuario' | 'administrador';
  habilitado: boolean;
  imagenPerfil: string;
  createdAt: string;
}

export interface PaginaUsuarios {
  items: UsuarioAdmin[];
  total: number;
  offset: number;
  limit: number;
}
