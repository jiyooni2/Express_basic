async function wait() {
  let temp = "B";
  let j;
  for (i = 0; i < 1000000000; i++) j++;
  temp = "A";
  console.log("in wait");
  return temp;
}

const home = async () => {
  console.log("start");
  const videos = await wait();
  console.log("finish");
  console.log("temp: ", videos);
};

home();
