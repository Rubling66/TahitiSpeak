import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Clock, Volume2, VolumeX, Save, RefreshCw } from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: any) => void;
}

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  notification_types: {
    lesson_reminders: boolean;
    achievements: boolean;
    social: boolean;
    marketing: boolean;
    system: boolean;
  };
  frequency: {
    lesson_reminders: 'immediate' | 'daily' | 'weekly';
    achievements: 'immediate' | 'daily' | 'weekly';
    social: 'immediate' | 'daily' | 'weekly';
    marketing: 'immediate' | 'daily' | 'weekly';
    system: 'immediate' | 'daily' | 'weekly';
  };
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onSave
}) => {
  const {
    preferences,
    loading,
    saving,
    updatePreferences,
    refreshPreferences
  } = useNotificationPreferences(userId);

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local preferences when data loads
  useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences, localPreferences]);

  // Track changes
  useEffect(() => {
    if (preferences && localPreferences) {
      setHasChanges(JSON.stringify(preferences) !== JSON.stringify(localPreferences));
    }
  }, [preferences, localPreferences]);

  const handleChannelToggle = (channel: 'push_enabled' | 'email_enabled' | 'sms_enabled') => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      [channel]: !localPreferences[channel]
    });
  };

  const handleTypeToggle = (type: keyof NotificationPreferences['notification_types']) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      notification_types: {
        ...localPreferences.notification_types,
        [type]: !localPreferences.notification_types[type]
      }
    });
  };

  const handleFrequencyChange = (
    type: keyof NotificationPreferences['frequency'],
    frequency: 'immediate' | 'daily' | 'weekly'
  ) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      frequency: {
        ...localPreferences.frequency,
        [type]: frequency
      }
    });
  };

  const handleQuietHoursToggle = () => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      quiet_hours_enabled: !localPreferences.quiet_hours_enabled
    });
  };

  const handleQuietHoursChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      [field]: value
    });
  };

  const handleTimezoneChange = (timezone: string) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      timezone
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    
    try {
      await updatePreferences(localPreferences);
      onSave?.(localPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  };

  if (loading || !localPreferences) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const timezones = [
    'Pacific/Tahiti',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notification Preferences
        </h2>
        <button
          onClick={refreshPreferences}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Refresh preferences"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications on your device</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.push_enabled}
                  onChange={() => handleChannelToggle('push_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.email_enabled}
                  onChange={() => handleChannelToggle('email_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via text message</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.sms_enabled}
                  onChange={() => handleChannelToggle('sms_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-4">
            {Object.entries(localPreferences.notification_types).map(([type, enabled]) => (
              <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {type === 'lesson_reminders' && 'Reminders for your daily lessons'}
                    {type === 'achievements' && 'Notifications when you unlock achievements'}
                    {type === 'social' && 'Friend requests and social interactions'}
                    {type === 'marketing' && 'Updates about new features and promotions'}
                    {type === 'system' && 'Important system updates and maintenance'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={localPreferences.frequency[type as keyof typeof localPreferences.frequency]}
                    onChange={(e) => handleFrequencyChange(
                      type as keyof typeof localPreferences.frequency,
                      e.target.value as 'immediate' | 'daily' | 'weekly'
                    )}
                    disabled={!enabled}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleTypeToggle(type as keyof typeof localPreferences.notification_types)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quiet Hours</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {localPreferences.quiet_hours_enabled ? (
                  <VolumeX className="w-5 h-5 text-orange-600 mr-3" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Enable Quiet Hours</p>
                  <p className="text-sm text-gray-500">Disable notifications during specified hours</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.quiet_hours_enabled}
                  onChange={handleQuietHoursToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {localPreferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quiet_hours_start}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quiet_hours_end}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timezone</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Timezone
                </label>
                <select
                  value={localPreferences.timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="mt-8 flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      )}BllMil, SmarphonVoume2, VlumX,Save, RefreshCw Preference..../Preference
nerfaceNoificaiPreecePrs
 useI:sting;
  Sav?:(pfences:ny) => voi;
}

nfaceNotifiatiPrferece {
  psh_enble: booleanemil_enald: booean;
ss_enabled:bla;
  qet_hours_enld: booean  quet_hus_sart:string;
 que_ours_end:sting;
 tiez: ring  notficatin_ypes:
 lessn_reinders:blea;
    achiveme: boolea    scial:boolean;  markting: booan;  systm: booa;};
  frquny: {  sson_emnds:'immdiae' | 'diy' | 'wekly';  ahieve: 'mmdiate' | 'daiy' | 'wekly    socal: 'imediae'|'daily' | 'wekly';
    mketing: 'immedie' |'daily'|wkly    system: 'mediae'|'dily'|wekly;
  }
}<NotificationPreferencesProps>{
  userId,
  onSave
}ing,
    savrefh}=usNoifiations(uerId);
  const[localPreferences,setLocalPreferences]eStat<nPreferece | null>nullhsChngesHsChngesfalse);
 //Initializelocalreference w dat oas
 seEffct(() => { if(prefrces && !locPrefencs) {  setLocalPrefereces(rfencs);   }
},[prefc,localPrefeencs]);
//Tack chng
 seEffct(() => {f (prfrces && llPreferece){  setHasChages(JSON.strgfy(preerenes) !== JSON.srgiy(locPreference));   }
},[prefee,locPreference]);
consthandlCannelTggle = (channel: 'ph' |'email_enbed' | 'sm_enabld') => {f (!lcalPeference) eurn;
   sLcalPfereces({  ...lcalPreferecs cnl]:!loclPreference[cnl
  }  };
consthndleTypeToggle = (yp:keyfNoifictioP['ntiiaion_types']!localPreturn;
  LclPreferences...locP,
      otifiction_typs: {...ocPnotifictontyps[ty]!localPnotficatiotyes[ty]}
  });
  };

  const handFequecyCha = (
    typkeyof NotificationP['fequecy'],
    fquency: 'imedate' | 'aily' | 'wekly')=>{
if (!lclP) turn;
sLlP({
      ..loalPrfrefreqec: {
        ...llPfreqecy,
        [pe]: frequecy
      }
    });
  };

  cnst handleQuieHoursToggle = () => {
     (!lolPreferences) reur;
sLlP({
      ..loclPrefee!localP });
};

consthandleQHChnge =(ild: ''|'', value string) => {
    if(!localP) r;
seLcalP({...localPreferences,[fild]: vu);eTimezontimezon) => {
    if(!locPreferencs)retur;
  LcalPefeencs({
   localPefrncs,  timzo
    }
    if (!localPreferences) return;
    localPreecnSve?(loalcnoleErrring:, error if(prefeences)Localpreferences   }
};

if(lodi || !localPrerence {return(
     <div clNam="p-6 bg-whit oudd-lg hadow-smbodrbrder-gray-200">
       <iv classNam="nimate-pe">     <div lssName="-6bg-gay-200 undedw-1/3 mb-4"></div>    <div clsNam="space-y-3">
            {[...Aay6)].mp((_, )=>(
              <div ky={i} clasNam="h-4bg-gay-200 oudd w-full"></div>        ))        </div>
        </div>
      </div>
    )  }
Pacific/ahitip6bgwhie runded-lghdow-sm bordr bordergra200ivclssNm="flex items-cente justify-between mb-6"h2text-xl ont-semibod tt-gray-900flex ">
         <Bell clasNm="w5 h5 mr- /
        h2<button
      onClick=refrePreferec}-gray500hover:gy7p1title="Refreh prefern" <RefreshCwclassName="w-4h-4"/>butoniv
iv8Channl text-gray-900n p-4 bg-gray-50 rouded-lg className="flex items-center"Smrtphon cassName="w-5-5 tex-blue-600 -3 />
                <div>
                  < clasNam="fot-mium text-gray-900p</p>            </div>
div  <labelclassName="relativeinline-flexitems-centercursor-ponter"nputypecckoxlocalPreeencesnelTogl   className="sr-onlypeer"    w-11 h-6 bg-gray-200 peer-ocus:outine-nonper-focu:ring4 p-foc:rnglue-300 roundd-full prpeer-checke:after:translt-x-fulpeer-cecked:afer:bdrwhit ftr:cnent-[''] fer:souteafter:to-[2px]fr:lef[2px]afr:bg-whie after:border3after:borderaftr:roundd-full aftr:h-5afer:w-5 ater:trnsi-llper-checked:bg-bue-600"></div>label<iv classNameflx temsctrjustify-bw p-4 bg-gry-50 round-lg"><ivclssN="fxitems-ntr"Malw-5h5 xgr-600 mr-3 /p classNm="fon-edum textgry900">EmipReceivevamil</>            </div>
div <labelclassName="relativeinline-flexitems-center cursor-ponter"nputypechckoxlcalPeferences.elnelToglemal  className="sr-only peer"      className="w-11h-6bg-gray-200peer-focus:outline-nonepeer-focus:ring-4peer-focus:ring-blue-300rounded-fullpeerpeer-checked:after:translate-x-fullpeer-checke:after:border-whteafter:content-['']after:absoluteafter:top-[2px]after:left-[2px]after:bg-whiteafter:border-gray-300after:borderafter:rounded-fullafter:h-5aftr:w-5 fter:tnsiin-all pee-checked:bg-blue-600"><div <label>  /
divfliscerjusy-between p-4 bg-gry-50 ruded-lg"  flex item-entr  Smartphonew-5 h-5 t-purpl-600 3 /p classNmfotmdiu txt-gay-900SMS NotifictopReceivenotificationsviatextmessage</p>
</v>divlabel className="relate inline-flex items-center cursor-pointer"nputypechckboxlcPrfeecs.ss_eabldnelToglsmsabl'  className="sr-only peer"    w-11 h-6 bg-gray-200 peer-ocus:outin-noneperfous:rig-4 pe-foc:rnglu-300round-fulpeer peer-cecked:afe:anslatex-fll eer-checke:fr:ber-white fr:content-[''] ftr:absouteafter:to-[2px]fr:lef[2px]afr:bg-whie after:border3afer:bdrfter:roued-fullafr:h-5 afer:w-5fr:tranition-all peer-checked:bg-blue-600"></div>label/dv></div>

{/*Notifcain T */}<div>
<3 lassNam"text-lg nt-medium text-gay-900 b-4">Noificin T</h3>     <divclassName="space-y-4">
{Objt.trisloPreferc.notificain_tes).mp(([ypnabl]= (key={type}n p-4 bg-gray-50 rouded-lgp classNm="fon-edu tx-gray900 pialze
                    {typ.rplac('_', ' ')}
                 p{typ === 'esson_reminds' && 'Remindrs fordlys'}{type==='achievements'&&'Notificationswhenyouunlockacheements'}{type==='socl' && 'Frnd rquss ad scal ntera'}  {typ == 'rkeing' && 'Updts about nw faures ad prom'  {typ == 'systm'&&'Importt system upats d me'  <p    pac-x-4  select  vlu={calPeferenes.freqec[ype  keyf pe lolPreferece.frquency]} onChng{()=> handlFequencChange(  yp akeyfypofoclPeferees.freqec,    e.target.value as 'immediate' | 'daily' | 'weekly'    )}    dsabled={!enabled}  classNametext-s border border-gray-300 roded px-2 p1 fcus:oulne-none ous:rng-2 fcus:rig-blue-500 diabled:bg-gray-100 disabled:text-gray-400>
                    <option valu"imedie">Iedae</p>  <ptio vlu"iy">Dl</p>    <option value="weekly">Weekly<option    select    labelrelative inline-cror-ponr    nput   ypechkbx   chekd{nbled}  nChng={() =>hleTyeTggle(type as keyf ypeof lcPreferences.notifiati_yps)}className="sr-onlypeer"
/>  <dv classNamew-11 h-6 bg-gry-200 pee-focus:oulenoe peer-fcus:rng-4 peer-ous:rng-blue-300 ruded-fullpeerpeer-:ate:rnslte-x-full pee-checd:afer:border-whte after:cotet-[''] after:abslue ater:p-[2px]aftr:lft-[2px] fter:b-wit aftr:borer-gray-300after:borderfter:roude-ful aftr:-5 ftr:w-5 fte:ras-allpeer-ed:bg-blu-600"></iv>  <label    
            ))}div text-gray-900">Quiet Hours</h3>
          <divclassName="p-4 bg-gray-50 rounded-lg">
            <div className="jutify-btween mb4divflexitemscenter  {loclPrefereces.q_h_eabled ? (VolumeXw-5 h-5 text-orng600 mr3 /  ) : (
                  Volume2w-5h5 x-gra400 mr-3 /)}
                pcassNamefont-medum txgy-900pDiabl</p>div<labelclassName="relativenline-flex iems-enter cursor-pointer"><input
                typecckoxlclPreferencesang={handleQuietHoursToggle}
                  lassNam="sr-only peer"
                />
                <iv className="w-11 -6 bg-gry-200 peer-focus:outlie-none peer-focus:rin-4 per-fous:ring-blue-300 rounded-full peer peer-c:after:translate-x-fullpeer-cecked:fter:borr-wite fter:cotnt-['] after:absolte after:top-[2px] after:left-[2px] after:bg-whte after:border-gray-300 after:bordr afer:runded-fll after:h-5 after:w-5 after:tanitio-l per-ed:bg-blu-600"></iv><labellocalPreeenceslclassNae="bck txsm fnt-medim text-gay-700 mb1
                    /label><nplocalPreeenceseQuitHours                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-nonefocus:ring-2focus:ring-blue-500"
lclassNae="bck txsm fntmu txt-gry-700 m-1"Ed Time              </label>
<nplocalPreeenceseQuitHours        className="w-fullborderborder-gray-300rounded-mdpx-3py-2focus:outline-nonefocus:ring-2focus:ring-blue-500"</div>)}divtgy900 mb4Timezone</h3>divp4bggray-0rounded-lg"div clasN="flx item-ceter"  Clock className="w-5 -5 text-blue-600 mr-" /   className="flex-1"  lcassNameblock xt-sm ft-mdium text-gray-700 mb-1
                  
                l  s  lclPreferences  Timezonee.argt.classNam="w-ful bodbordr-gry-300 rondd-md px-3y-2 fous:utn-nfous:n-2 focus:rin-blu-500"opionopionsdiv/v>div{hasChanges&&(
      mt-8 dsacex- pt-6 border-t border-gray-200bonClick={handleReset}
          className="px-4 py-2 text-gray-700 bg-gray-100 hoer:bg-gry-200 ounded-md trsiin-colors drao-200>
        Reset
          </butt>
          <button
            onSavsvclassName="px-6py-2bg-blue-600text-whiterounded-mdhover:bg-blue-700disabled:paciy-50 disbld:ursor-not-alloedfex item-center pc-x2transitioncolorsduation00
         {aving?(      div className="animae-spin ruded-full h-4 w-4 border-b-2 border-white"></div>  <sp>ing...</span>            </>
):(  <  wh  <span>s</pan>    )}  butt  iv
      )};

export default NotificationPreferences