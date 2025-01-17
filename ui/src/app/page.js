import ClientPage from "@/app/UiComponents/client-page/ClientPage.jsx";
import LanguageProvider from "@/app/providers/LanguageProvider.jsx";

export default function page(){
    return(
    <LanguageProvider>
    <ClientPage/>
        <img src="'ftp://dreamstudiio.com/uploads/3c1167bd-78e1-4680-a1e9-1538c37a5767.jpg"/>
    </LanguageProvider>
    )

}