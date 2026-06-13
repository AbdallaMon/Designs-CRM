export default function test() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      // try{
      //     const response=await fetch('https://api.example.com/data')
      //     const result=await response.json()
      //     setData(result)
      // }
      // catch(error){
      //     console.error('Error fetching data:',error)
      // }
      // finally{
      //     setLoading(false)
      // }
      setData(galleryData);
    }

    fetchData();
  }, []);

  return (
    <>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </>
  );
}
