@service(#{ title: "Pet Store" })
namespace PetStore;

/** A pet sold by the store. */
model Pet {
  id: int32;
  name: string;
  tag?: string;
}

model CreatePet {
  name: string;
  tag?: string;
}

interface Pets {
  getPet(petId: int32): Pet;
  createPet(pet: CreatePet): Pet;
}
