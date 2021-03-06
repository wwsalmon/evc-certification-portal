import SEO from "../../components/SEO";
import H1 from "../../components/H1";
import {GetServerSideProps} from "next";
import {supabase} from "../../lib/supabaseClient";
import {ssrRedirect} from "../../lib/apiResponses";
import RedirectIfSignedOut from "../../components/RedirectIfSignedOut";
import {useEffect, useState} from "react";
import {CertificationRequestObj, TestObj} from "../../lib/types";
import LinkWrapper from "../../components/LinkWrapper";
import {format} from "date-fns";
import Label from "../../components/Label";
import {TestStatus} from "../../lib/labels";
import ReactPaginate from "react-paginate";

export default function AllRequests({}: {}) {
    const [requests, setRequests] = useState<(CertificationRequestObj & {models: {name: string}[]} & {manufacturers: {name: string}} & {tests: TestObj[]})[] | null>(null);
    const [page, setPage] = useState<number>(0);
    const [totalRequests, setTotalRequests] = useState<number>(0);

    useEffect(() => {
        (async () => {
            const {data, count, error} = await supabase
                .from<CertificationRequestObj>("requests")
                .select("*, models (name), manufacturers (name), tests (*)", {count: "exact"})
                .order("requestDate", {ascending: false})
                .range(20 * page, 20 * (page + 1));

            if (error) console.log(error);

            // @ts-ignore supabase doesn't handle types for lookups
            setRequests(data);

            setTotalRequests(count);
        })();
    }, [page]);

    return (
        <div className="max-w-7xl mx-auto my-4 p-6 bg-white rounded border shadow-sm mt-20">
            <SEO/>
            <RedirectIfSignedOut/>
            <H1 className="mb-4">Incoming certification requests</H1>
            {requests ? !!requests.length ? (
                <div className="overflow-x-auto">
                    <div className="h-12 flex items-center">
                        <div className="flex-shrink-0 w-32"><Label>Manufacturer</Label></div>
                        <div className="flex-shrink-0 w-64"><Label>Models</Label></div>
                        <div className="flex-shrink-0 w-48"><Label>Firmware version</Label></div>
                        <div className="flex-shrink-0 w-32"><Label>New hardware?</Label></div>
                        <div className="flex-shrink-0 w-32"><Label>Request date</Label></div>
                        <div className="flex-shrink-0 w-32"><Label>Tier</Label></div>
                        <div className="flex-shrink-0 w-48"><Label>Status</Label></div>
                    </div>
                    <hr className="text-gray-1" style={{minWidth: 1152}}/>
                    {requests
                        .sort((a, b) => +new Date(b.requestDate) - +new Date(a.requestDate))
                        .map(request => (
                            <LinkWrapper key={request.id} href={`/request/${request.id}`} className="flex h-12 items-center">
                                <div className="flex-shrink-0 w-32 pr-4 truncate"><span>{request.manufacturers.name}</span></div>
                                <div className="flex-shrink-0 w-64 pr-4 truncate"><span>{request.models.map(d => d.name).join(", ")}</span></div>
                                <div className="flex-shrink-0 w-48 pr-4 text-gray-1 truncate"><span>{request.firmwareVersion}</span></div>
                                <div className="flex-shrink-0 w-32 text-gray-1"><span>{request.isHardware ? "Yes" : "No"}</span></div>
                                <div className="flex-shrink-0 w-32 text-gray-1"><span>{format(new Date(request.requestDate), "MMMM d, yyyy")}</span></div>
                                <div className="flex-shrink-0 w-32 text-gray-1"><span>Tier {request.tier}</span></div>
                                <div className="flex-shrink-0 w-48">
                                    {request.tests.length ? (
                                        <TestStatus
                                            status={request.tests.sort((a, b) => +new Date(b.approveDate) - +new Date(a.approveDate))[0].status}
                                            testDate={request.tests.sort((a, b) => +new Date(b.approveDate) - +new Date(a.approveDate))[0].testDate}
                                        />
                                    ) : (
                                        <div className="flex items-center">
                                            <div className={`rounded-full border-2 border-yellow-300 w-2 h-2 mr-3`}/>
                                            <div><span>Awaiting approval</span></div>
                                        </div>
                                    )}
                                </div>
                            </LinkWrapper>
                        ))
                    }
                    <ReactPaginate
                        pageCount={Math.ceil(totalRequests / 20)}
                        pageRangeDisplayed={5}
                        marginPagesDisplayed={2}
                        initialPage={page}
                        onPageChange={data => setPage(data.selected)}
                        containerClassName="flex items-center justify-between max-w-3xl text-gray-1 mt-8"
                        activeClassName="bg-ev-blue p-2 rounded text-white"
                    />
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-1">No requests found.</p>
                </>
            ) : (
                <>
                    <p>Loading...</p>
                </>
            )}
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    const {user, error} = await supabase.auth.api.getUserByCookie(req);

    if (!user) return ssrRedirect("/auth/signin");

    return {props: {}};
}