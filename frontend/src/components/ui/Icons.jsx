import {
  Activity as ActivityIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  HelpCircle as HelpCircleIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  Mail as MailIcon,
  LogOut as LogOutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ExternalLink as ExternalLinkIcon,
  Clock as ClockIcon,
  BookOpen as BookOpenIcon,
  Target as TargetIcon,
  Compass as CompassIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  UserPlus as UserPlusIcon,
  Lock as LockIcon,
  Share2 as Share2Icon,
  Building2 as BuildingIcon,
  Flag as FlagIcon,
  ArrowRight as ArrowRightIcon,
  Layout as LayoutIcon,
  List as ListIcon,
  Globe as GlobeIcon,
  Copy as CopyIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Check as CheckIcon,
  X as XIcon,
  Bell as BellIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Filter as FilterIcon,
  SortAsc as SortAscIcon,
  SortDesc as SortDescIcon,
  Mic as MicIcon,
  Video as VideoIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Settings2 as Settings2Icon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Flame as FlameIcon,
  Crown as CrownIcon,
  Award as AwardIcon,
  Certificate as CertificateIcon,
  Users as UsersIcon,
  UserCheck as UserCheckIcon,
  MailOpen as MailOpenIcon,
  Send as SendIcon,
  Link as LinkIcon,
  Link2 as Link2Icon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircle2 as CheckCircle2Icon,
  Info as InfoIcon,
  Loader2 as Loader2Icon,
  Loader as LoaderIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Home as HomeIcon,
  Newspaper as NewspaperIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Globe2 as Globe2Icon,
  Grid as GridIcon,
  Camera as CameraIcon,
  MicOff as MicOffIcon,
  VideoOff as VideoOffIcon,
  ImageOff as ImageOffIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  StarHalf as StarHalfIcon,
  Gift as GiftIcon,
  BellRing as BellRingIcon,
  Phone as PhoneIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Database as DatabaseIcon,
  HardDrive as HardDriveIcon,
  Cloud as CloudIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Bluetooth as BluetoothIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  Plug as PlugIcon,
  RefreshCw as RefreshCwIcon,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon,
  CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon,
  Thermometer as ThermometerIcon,
  Droplet as DropletIcon,
  Droplets as DropletsIcon,
  Snowflake as SnowflakeIcon,
  Wind as WindIcon,
  CloudFog as CloudFogIcon,
} from 'lucide-react'

const TAILLE_BASE = 18
const CLASSE_BASE = 'text-slate-600'

/**
 * Les anciens ecrans passent parfois une taille "relative" (2, 3, 4...).
 * On la convertit en pixels pour garder des icones lisibles partout, tout
 * en continuant d'accepter les tailles absolues comme 24 ou 32.
 */
function normaliserTaille(taille) {
  if (typeof taille !== 'number' || Number.isNaN(taille)) return TAILLE_BASE
  return taille <= 8 ? taille * 4 : taille
}

export function creerIcone(Icone) {
  const IconeVeillia = ({ size, className, ...props }) => (
    <Icone
      size={normaliserTaille(size)}
      className={className || CLASSE_BASE}
      {...props}
    />
  )
  IconeVeillia.displayName = Icone.displayName || Icone.name || 'IconeVeillia'
  return IconeVeillia
}

export const Menu = creerIcone(MenuIcon)
export const Search = creerIcone(SearchIcon)
export const HelpCircle = creerIcone(HelpCircleIcon)
export const Settings = creerIcone(SettingsIcon)
export const User = creerIcone(UserIcon)
export const Mail = creerIcone(MailIcon)
export const LogOut = creerIcone(LogOutIcon)
export const ChevronLeft = creerIcone(ChevronLeftIcon)
export const ChevronRight = creerIcone(ChevronRightIcon)
export const ChevronDown = creerIcone(ChevronDownIcon)
export const ExternalLink = creerIcone(ExternalLinkIcon)
export const Clock = creerIcone(ClockIcon)
export const BookOpen = creerIcone(BookOpenIcon)
export const Target = creerIcone(TargetIcon)
export const Compass = creerIcone(CompassIcon)
export const TrendingUp = creerIcone(TrendingUpIcon)
export const Shield = creerIcone(ShieldIcon)
export const Save = creerIcone(SaveIcon)
export const Image = creerIcone(ImageIcon)
export const Eye = creerIcone(EyeIcon)
export const EyeOff = creerIcone(EyeOffIcon)
export const UserPlus = creerIcone(UserPlusIcon)
export const Lock = creerIcone(LockIcon)
export const Share2 = creerIcone(Share2Icon)
export const Building2 = creerIcone(BuildingIcon)
export const Flag = creerIcone(FlagIcon)
export const ArrowRight = creerIcone(ArrowRightIcon)
export const Layout = creerIcone(LayoutIcon)
export const List = creerIcone(ListIcon)
export const Globe = creerIcone(GlobeIcon)
export const Copy = creerIcone(CopyIcon)
export const Plus = creerIcone(PlusIcon)
export const Minus = creerIcone(MinusIcon)
export const Check = creerIcone(CheckIcon)
export const X = creerIcone(XIcon)
export const Bell = creerIcone(BellIcon)
export const Star = creerIcone(StarIcon)
export const Heart = creerIcone(HeartIcon)
export const ThumbsUp = creerIcone(ThumbsUpIcon)
export const Download = creerIcone(DownloadIcon)
export const Upload = creerIcone(UploadIcon)
export const Filter = creerIcone(FilterIcon)
export const SortAsc = creerIcone(SortAscIcon)
export const SortDesc = creerIcone(SortDescIcon)
export const Mic = creerIcone(MicIcon)
export const Video = creerIcone(VideoIcon)
export const Play = creerIcone(PlayIcon)
export const Pause = creerIcone(PauseIcon)
export const Settings2 = creerIcone(Settings2Icon)
export const Zap = creerIcone(ZapIcon)
export const Sparkles = creerIcone(SparklesIcon)
export const Flame = creerIcone(FlameIcon)
export const Crown = creerIcone(CrownIcon)
export const Award = creerIcone(AwardIcon)
export const Certificate = creerIcone(CertificateIcon)
export const Users = creerIcone(UsersIcon)
export const UserCheck = creerIcone(UserCheckIcon)
export const MailOpen = creerIcone(MailOpenIcon)
export const Send = creerIcone(SendIcon)
export const Link = creerIcone(LinkIcon)
export const Link2 = creerIcone(Link2Icon)
export const Edit = creerIcone(EditIcon)
export const Trash2 = creerIcone(Trash2Icon)
export const AlertCircle = creerIcone(AlertCircleIcon)
export const AlertTriangle = creerIcone(AlertTriangleIcon)
export const CheckCircle = creerIcone(CheckCircleIcon)
export const CheckCircle2 = creerIcone(CheckCircle2Icon)
export const Info = creerIcone(InfoIcon)
export const Loader2 = creerIcone(Loader2Icon)
export const Loader = creerIcone(LoaderIcon)
export const BarChart = creerIcone(BarChartIcon)
export const PieChart = creerIcone(PieChartIcon)
export const LineChart = creerIcone(LineChartIcon)
export const Home = creerIcone(HomeIcon)
export const Newspaper = creerIcone(NewspaperIcon)
export const Briefcase = creerIcone(BriefcaseIcon)
export const Calendar = creerIcone(CalendarIcon)
export const MapPin = creerIcone(MapPinIcon)
export const Globe2 = creerIcone(Globe2Icon)
export const Camera = creerIcone(CameraIcon)
export const MicOff = creerIcone(MicOffIcon)
export const VideoOff = creerIcone(VideoOffIcon)
export const ImageOff = creerIcone(ImageOffIcon)
export const Sun = creerIcone(SunIcon)
export const Moon = creerIcone(MoonIcon)
export const StarHalf = creerIcone(StarHalfIcon)
export const Gift = creerIcone(GiftIcon)
export const BellRing = creerIcone(BellRingIcon)
export const Phone = creerIcone(PhoneIcon)
export const Smartphone = creerIcone(SmartphoneIcon)
export const Tablet = creerIcone(TabletIcon)
export const Laptop = creerIcone(LaptopIcon)
export const Monitor = creerIcone(MonitorIcon)
export const Code = creerIcone(CodeIcon)
export const Terminal = creerIcone(TerminalIcon)
export const Database = creerIcone(DatabaseIcon)
export const HardDrive = creerIcone(HardDriveIcon)
export const Cloud = creerIcone(CloudIcon)
export const CloudUpload = creerIcone(CloudUploadIcon)
export const CloudDownload = creerIcone(CloudDownloadIcon)
export const Wifi = creerIcone(WifiIcon)
export const WifiOff = creerIcone(WifiOffIcon)
export const Bluetooth = creerIcone(BluetoothIcon)
export const Battery = creerIcone(BatteryIcon)
export const BatteryCharging = creerIcone(BatteryChargingIcon)
export const Plug = creerIcone(PlugIcon)
export const RefreshCw = creerIcone(RefreshCwIcon)
export const Sunrise = creerIcone(SunriseIcon)
export const Sunset = creerIcone(SunsetIcon)
export const CloudRain = creerIcone(CloudRainIcon)
export const CloudSnow = creerIcone(CloudSnowIcon)
export const Thermometer = creerIcone(ThermometerIcon)
export const Droplet = creerIcone(DropletIcon)
export const Droplets = creerIcone(DropletsIcon)
export const Snowflake = creerIcone(SnowflakeIcon)
export const Wind = creerIcone(WindIcon)
export const CloudFog = creerIcone(CloudFogIcon)
export const Grid = creerIcone(GridIcon)
export const Activity = creerIcone(ActivityIcon)
