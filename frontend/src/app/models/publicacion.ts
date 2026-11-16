export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  imagenPerfil: string;
}

export interface Comentario {
  _id: string;
  publicacion: string;
  autor: AutorPublicacion;
  texto: string;
  modificado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginaComentarios {
  items: Comentario[];
  total: number;
  offset: number;
  limit: number;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  autor: AutorPublicacion;
  meGusta: string[];
  cantidadMeGusta: number;
  cantidadComentarios: number;
  createdAt: string;
}

export interface PaginaPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export type Orden = 'fecha' | 'meGusta';