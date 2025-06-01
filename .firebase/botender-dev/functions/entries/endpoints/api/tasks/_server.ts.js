import { j as json, e as error } from "../../../../chunks/index2.js";
import { getDocs, query, collection, orderBy } from "firebase/firestore";
import { d as db } from "../../../../chunks/firebase.js";
const GET = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "tasks"), orderBy("createAt", "desc"))
    );
    const res = [];
    querySnapshot.forEach((doc) => {
      const task = {
        id: doc.id,
        action: doc.data().action,
        createAt: doc.data().createAt,
        name: doc.data().name,
        trigger: doc.data().trigger
      };
      res.push(task);
    });
    return json(res);
  } catch {
    throw error(400, "Fail to fetch data from Firestore.");
  }
};
export {
  GET
};
